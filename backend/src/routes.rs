use std::collections::HashMap;

use fancy_regex::Regex;
use sqlx::Postgres;
use tide::http::cookies::SameSite;
use tide::http::Cookie;
use tide::Request;
use tide::Result;
use tide_sqlx::SQLxRequestExt;
use time::Duration;

use crate::models::SearchQuery;
use crate::prelude::*;

use crate::messages;
use crate::models;
use crate::queries;
use crate::queries::code::CODES_VERIFY;
use crate::utils;
use crate::ToUrl;

pub async fn do_prefetch(_: Request<State>) -> Result {
    Ok(Body::ok())
}

pub async fn do_register(mut req: Request<State>) -> Result {
    let user = req.ext::<models::User>();
    if user.is_some() {
        return Ok(Body::throw(messages::USER_ALREADY_LOGGED_IN));
    }
    let form = req.body_json::<models::RegisterForm>().await?;
    if !Regex::new("^[\\w\\d\\-\\._]{3,20}$")
        .unwrap()
        .is_match(&form.name)
        .unwrap_or_default()
    {
        return Ok(Body::throw(messages::INVALID_NAME));
    }
    if !Regex::new("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$")
        .unwrap()
        .is_match(&form.email)
        .unwrap_or_default()
    {
        return Ok(Body::throw(messages::INVALID_EMAIL));
    }
    if !Regex::new("^(?=.*([A-Z]){1,})(?=.*[!@#$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{8,100}$")
        .unwrap()
        .is_match(&form.password)
        .unwrap_or_default()
    {
        return Ok(Body::throw(messages::INVALID_PASSWORD));
    }
    let mut conn = req.sqlx_conn::<Postgres>().await;
    match queries::user::get_by_name(&mut conn, &form.name).await {
        Ok(user) => {
            if user.is_some() {
                debug!("name '{}' is already in use!", form.name);
                return Ok(Body::throw(messages::NAME_ALREADY_IN_USE));
            }
        }
        Err(err) => {
            error!("unable to get user for name '{}'! Err: {}", form.name, err);
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    }
    let auth = &req.state().config.auth;
    let hashed_password = ok_or_throw!(
        utils::hash_password(&form.password, auth),
        messages::INTERNAL_ERROR
    );
    let user =
        match queries::user::insert(&mut conn, &form.name, &form.email, &hashed_password).await {
            Ok(model) => model,
            Err(_) => {
                debug!("user '{}' already exists!", form.email);
                return Ok(Body::throw(messages::USER_ALREADY_EXISTS));
            }
        };
    let verification = match queries::code::insert(&mut conn, CODES_VERIFY, &user.id).await {
        Ok(model) => model,
        Err(err) => {
            error!(
                "unable to create verification for user '{}'! Err: {}",
                user.email, err
            );
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    let state = req.state();
    let hostname = ok_or_throw!(state.config.server.to_url(), messages::INTERNAL_ERROR);
    let template_id = "verify";
    let mut content = HashMap::new();
    let name = user.name.as_ref().unwrap_or(&user.email);
    content.insert("name", name.as_str());
    let verification_url = format!("{}/verify/{}", hostname, verification.code);
    content.insert("verification_url", &verification_url);
    let multipart = match utils::create_multipart(template_id, content) {
        Ok(body) => body,
        Err(err) => {
            error!(
                "failed to read email for template id '{}'! Err: {}",
                template_id, err
            );
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    let recipient = format!("{} <{}>", name, user.email);
    if let Err(err) = utils::send_email(&recipient, multipart, &state.config.mail) {
        error!("failed to send verification email! Err: {}", err);
        return Ok(Body::throw(messages::INTERNAL_ERROR));
    }
    debug!("verification email was sent to '{}'", recipient);
    Ok(Body::ok())
}

pub async fn do_login(mut req: Request<State>) -> Result {
    let user = req.ext::<models::User>();
    if user.is_some() {
        return Ok(Body::throw(messages::USER_ALREADY_LOGGED_IN));
    }
    let form = req.body_json::<models::LoginForm>().await?;
    let auth = &req.state().config.auth;
    let hashed_password = ok_or_throw!(
        utils::hash_password(&form.password, auth),
        messages::INTERNAL_ERROR
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let user =
        match queries::user::get_by_email_and_password(&mut conn, &form.email, &hashed_password)
            .await
        {
            Ok(model) => match model {
                Some(user) => user,
                None => {
                    debug!("user '{}' does not exist or password is wrong!", form.email);
                    return Ok(Body::throw(
                        messages::USER_DOES_NOT_EXIST_OR_PASSWORD_IS_WRONG,
                    ));
                }
            },
            Err(err) => {
                error!(
                    "unable to get user for email and password '{}'! Err: {}",
                    form.email, err
                );
                return Ok(Body::throw(messages::INTERNAL_ERROR));
            }
        };
    if !user.verified {
        debug!("user '{}' is not verified!", user.email);
        return Ok(Body::throw(messages::USER_IS_NOT_VERIFIED));
    }
    let session = match queries::session::insert(&mut conn, &user.id).await {
        Ok(model) => model,
        Err(err) => {
            error!(
                "unable to create session for user '{}'! Err: {}",
                user.email, err
            );
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    let options = &req.state().config.server.options;
    let mut rsp = Body::ok();
    let mut cookie = Cookie::new("token", session.token);
    cookie.set_path("/");
    cookie.set_secure(true);
    cookie.set_same_site(SameSite::Strict);
    cookie.set_max_age(Duration::hours(options.session_hours));
    rsp.insert_cookie(cookie);
    debug!("user '{}' was logged in.", user.email);
    Ok(rsp)
}

pub async fn do_logout(req: Request<State>) -> Result {
    let user = match req.ext::<models::User>() {
        Some(user) => user,
        None => {
            return Ok(Body::throw(messages::USER_NOT_LOGGED_IN));
        }
    };
    let mut rsp = Body::ok();
    let mut cookie = Cookie::named("token");
    cookie.set_path("/");
    cookie.set_secure(true);
    cookie.set_same_site(SameSite::Strict);
    rsp.remove_cookie(cookie);
    debug!("user '{}' was logged out.", user.email);
    Ok(rsp)
}

pub async fn do_verify(mut req: Request<State>) -> Result {
    let form = req.body_json::<models::VerfiyForm>().await?;
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let user = match queries::user::get_by_verify_code(&mut conn, &form.code).await {
        Ok(model) => match model {
            Some(user) => user,
            None => {
                debug!("invalid verification for code '{}'!", form.code);
                return Ok(Body::throw(messages::INVALID_VERIFICATION));
            }
        },
        Err(err) => {
            error!(
                "unable to get user for verify code '{}'! Err: {}",
                form.code, err
            );
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    if user.verified {
        return Ok(Body::throw(messages::USER_ALREADY_VERIFIED));
    }
    if let Err(err) = queries::user::update_verified(&mut conn, &user.id, true).await {
        error!(
            "unable to update verified status for user '{}'! Err: {}",
            user.email, err
        );
        return Ok(Body::throw(messages::INTERNAL_ERROR));
    }
    debug!("user '{}' was verified.", user.email);
    Ok(Body::ok())
}

pub async fn do_search(req: Request<State>) -> Result {
    let query = req.query::<SearchQuery>()?;
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let stations = match queries::station::get_by_search_query(&mut conn, query).await {
        Ok(models) => models,
        Err(err) => {
            error!("unable to get stations for search query! Err: {}", err);
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    Ok(Body::with(stations))
}

pub async fn get_user(req: Request<State>) -> Result {
    let user = req.ext::<models::User>();
    Ok(Body::with(user))
}

pub async fn get_user_by_name(req: Request<State>) -> Result {
    let user_name = ok_or_throw!(req.param("name"), messages::USER_DOES_NOT_EXIST);
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let user = match queries::user::get_by_name(&mut conn, user_name).await {
        Ok(model) => match model {
            Some(user) => user,
            None => {
                debug!("user for name '{}' does not exist!", user_name);
                return Ok(Body::throw(messages::USER_DOES_NOT_EXIST));
            }
        },
        Err(err) => {
            error!("unable to get user for name '{}'! Err: {}", user_name, err);
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    if !user.verified {
        debug!("user for name '{}' is not verified!", user_name);
        return Ok(Body::throw(messages::USER_DOES_NOT_EXIST));
    }
    Ok(Body::with(user))
}

pub async fn get_station_by_id(req: Request<State>) -> Result {
    let station_id = ok_or_throw!(
        ok_or_throw!(req.param("id"), messages::STATION_DOES_NOT_EXIST).parse::<i32>(),
        messages::INVALID_ID
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let station = match queries::station::get_by_id(&mut conn, &station_id).await {
        Ok(model) => match model {
            Some(station) => station,
            None => {
                debug!("station for id '{}' does not exist!", station_id);
                return Ok(Body::throw(messages::STATION_DOES_NOT_EXIST));
            }
        },
        Err(err) => {
            error!(
                "unable to get station for id '{}'! Err: {}",
                station_id, err
            );
            return Ok(Body::throw(messages::INTERNAL_ERROR));
        }
    };
    Ok(Body::with(station))
}
