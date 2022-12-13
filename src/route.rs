use async_std::io::ReadExt;
use fancy_regex::Regex;
use lettre::message::MultiPart;
use serde::Serialize;
use sqlx::Acquire;
use sqlx::Postgres;
use surf::http::cookies::SameSite;
use tide::http::Cookie;
use tide::log::warn;
use tide::Request;
use tide::Result;
use tide_sqlx::SQLxRequestExt;
use time::Duration;

use crate::body::Body;
use crate::messages;
use crate::model;
use crate::ok_or_throw;
use crate::server::State;
use crate::some_or_throw;
use crate::utils;
use crate::Category;
use crate::ToSql;
use crate::ToUrl;

pub async fn do_prefetch(_: Request<State>) -> Result {
    Ok(Body::ok())
}

pub async fn do_register(mut req: Request<State>) -> Result {
    let user = req.ext::<model::User>();
    if user.is_some() {
        return Ok(Body::throw(messages::USER_ALREADY_LOGGED_IN));
    }
    let form = req.body_json::<model::RegisterForm>().await?;
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
    let auth = &req.state().config.auth;
    let hashed_password = ok_or_throw!(
        utils::hash_password(&form.password, auth),
        messages::INTERNAL_ERROR
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            INSERT INTO users (email, password)
            VALUES ('{email}', '{password}')
            RETURNING users.*
        "#,
        email = form.email,
        password = hashed_password,
    );
    let user = match sqlx::query_as::<_, model::User>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
        Ok(model) => model,
        Err(_) => {
            debug!("user '{}' already exists!", form.email);
            return Ok(Body::throw(messages::USER_ALREADY_EXISTS));
        }
    };
    let sql = format!(
        r#"
            INSERT INTO verifications (user_id)
            VALUES ('{user_id}')
            RETURNING verifications.*
        "#,
        user_id = user.id,
    );
    let verification = match sqlx::query_as::<_, model::Verification>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
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
    let recipient = format!(
        "{} <{}>",
        user.name.as_deref().unwrap_or_else(|| &user.email),
        user.email
    );
    let verification_url = format!("{}/verify/{}", hostname, verification.code);
    let content = MultiPart::alternative_plain_html(
        format!(
            "Click to verify your account: {url}",
            url = verification_url
        ),
        format!(
            "Click to verify your account: <a href=\"{url}\">{url}</a>",
            url = verification_url
        ),
    );
    if let Err(err) = utils::send_email(&recipient, content, &state.config.mail) {
        error!("failed to send verification email! Err: {}", err);
        return Ok(Body::throw(messages::INTERNAL_ERROR));
    }
    debug!("verification email was sent to {}", recipient);
    Ok(Body::ok())
}

pub async fn do_login(mut req: Request<State>) -> Result {
    let user = req.ext::<model::User>();
    if user.is_some() {
        return Ok(Body::throw(messages::USER_ALREADY_LOGGED_IN));
    }
    let form = req.body_json::<model::LoginForm>().await?;
    let auth = &req.state().config.auth;
    let hashed_password = ok_or_throw!(
        utils::hash_password(&form.password, auth),
        messages::INTERNAL_ERROR
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            SELECT users.* FROM users
            WHERE email = '{email}' AND password = '{password}'
        "#,
        email = form.email,
        password = hashed_password,
    );
    let user = match sqlx::query_as::<_, model::User>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
        Ok(model) => model,
        Err(_) => {
            debug!("user '{}' does not exist or password is wrong!", form.email);
            return Ok(Body::throw(
                messages::USER_DOES_NOT_EXIST_OR_PASSWORD_IS_WRONG,
            ));
        }
    };
    if !user.verified {
        debug!("user '{}' is not verified!", user.email);
        return Ok(Body::throw(messages::USER_IS_NOT_VERIFIED));
    }
    let sql = format!(
        r#"
            INSERT INTO sessions (user_id)
            VALUES ('{user_id}')
            ON CONFLICT (user_id) DO UPDATE
            SET token = uuid_generate_v4()
            RETURNING sessions.*
        "#,
        user_id = user.id,
    );
    let session = match sqlx::query_as::<_, model::Session>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
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

pub async fn do_verify(mut req: Request<State>) -> Result {
    let form = req.body_json::<model::VerfiyForm>().await?;
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            SELECT users.* FROM users
            INNER JOIN verifications ON users.id = verifications.user_id
            WHERE verifications.code = '{code}'
        "#,
        code = form.code,
    );
    let user = match sqlx::query_as::<_, model::User>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
        Ok(model) => model,
        Err(_) => {
            debug!("invalid verification for code '{}'!", form.code);
            return Ok(Body::throw(messages::INVALID_VERIFICATION));
        }
    };
    if user.verified {
        return Ok(Body::throw(messages::USER_ALREADY_VERIFIED));
    }
    let sql = format!(
        r#"
            UPDATE users
            SET verified = true
            WHERE users.id = '{user_id}'
        "#,
        user_id = user.id,
    );
    if let Err(err) = sqlx::query(&sql).execute(conn.acquire().await?).await {
        error!(
            "unable to update verified status for user '{}'! Err: {}",
            user.email, err
        );
        return Ok(Body::throw(messages::INTERNAL_ERROR));
    }
    debug!("user '{}' was verified.", user.email);
    Ok(Body::ok())
}

pub async fn get_user(req: Request<State>) -> Result {
    let user = req.ext::<model::User>();
    Ok(Body::with(user))
}

pub async fn get_user_by_name(req: Request<State>) -> Result {
    let user_name = ok_or_throw!(req.param("name"), messages::USER_DOES_NOT_EXIST);
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            SELECT users.* FROM users
            WHERE users.name = '{name}'
        "#,
        name = user_name,
    );
    let user = match sqlx::query_as::<_, model::User>(&sql)
        .fetch_one(conn.acquire().await?)
        .await
    {
        Ok(model) => model,
        Err(_) => {
            debug!("user for name '{}' does not exist!", user_name);
            return Ok(Body::throw(messages::USER_DOES_NOT_EXIST));
        }
    };
    if !user.verified {
        return Ok(Body::throw(messages::USER_DOES_NOT_EXIST));
    }
    Ok(Body::with(user))
}

pub async fn get_account(req: Request<State>) -> Result {
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    Ok(Body::with(account))
}

pub async fn add_account(mut req: Request<State>) -> Result {
    if req.ext::<model::Account>().is_some() {
        return Ok(Body::throw("already logged in with another account!"));
    }
    let add_account = req.body_json::<model::AddAccount>().await?;
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            INSERT INTO
                account
                (name, language)
            VALUES
                ('{name}', '{language}')
            RETURNING
                account.*,
                (
                    SELECT
                        sum(playtime)
                    FROM get_playtime(account.id)
                )
                AS playtime
        "#,
        name = add_account.name,
        language = add_account.language,
    );
    let account = sqlx::query_as::<_, model::Account>(&sql)
        .fetch_one(conn.acquire().await?)
        .await?;
    let sql = format!(
        r#"
            INSERT INTO
                device
                (uid, account_id)
            VALUES
                (uuid_generate_v4(), {account_id})
            RETURNING device.*
        "#,
        account_id = account.id,
    );
    let device = sqlx::query_as::<_, model::Device>(&sql)
        .fetch_one(conn.acquire().await?)
        .await?;
    Ok(Body::with(device))
}

pub async fn do_search(req: Request<State>) -> Result {
    let query = req.query::<model::Query>()?;
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            SELECT
                station.*,
                station_status.is_restricted,
                station_status.is_broken,
                station_status.is_no_track_info,
                station_status.is_hidden,
                station_status.is_icon,
                station_stats.playtime,
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END AS is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                    AND favorite.account_id = {account_id}
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                LEFT JOIN station_stats
                    ON station.id = station_stats.station_id
                    AND station_stats.account_id = {account_id}
                {conditions}
                AND station_status.is_hidden IS NOT true
                OFFSET {offset}
                LIMIT 10
        "#,
        account_id = account.id,
        offset = query.page.unwrap_or_default() * 10,
        conditions = ok_or_throw!(query.to_sql(), "cannot parse sql statement!"),
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_song(req: Request<State>) -> Result {
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let station = req.query::<model::Station>()?;
    let sql = format!(
        r#"
            INSERT INTO
                station_stats
                (account_id, station_id, playtime)
            VALUES
                ({account_id}, {station_id}, 1)
            ON CONFLICT (account_id, station_id)
            DO UPDATE
                SET playtime = station_stats.playtime + EXCLUDED.playtime,
                latest_at = now();
        "#,
        account_id = account.id,
        station_id = station.id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    sqlx::query(&sql).execute(conn.acquire().await?).await?;
    let mut response = surf::get(&station.url).header("icy-metadata", "1").await?;
    let meta_int = match response.header("icy-metaint") {
        Some(header) => header.as_str(),
        None => return Ok(Body::throw("no icy metadata header found!")),
    };
    let interval = match meta_int.parse::<usize>() {
        Ok(interval) => interval * 2,
        Err(_) => return Ok(Body::throw("icy metadata interval is not a number!")),
    };
    let mut total = 0;
    let mut bytes = Vec::new();
    let mut buf = [0; 10000];
    let mut title = None;
    loop {
        let len = ok_or_throw!(response.read(&mut buf).await, "cannot read stream data!");
        bytes.extend_from_slice(&buf);
        if total + len > interval {
            let metadata = String::from_utf8_lossy(&bytes);
            if let Some(cap) =
                ok_or_throw!(Regex::new("StreamTitle='([^;]*)';"), "cannot parse regex!")
                    .captures_iter(&metadata)
                    .next()
            {
                title = Some(cap.unwrap()[1].to_string());
            }
            break;
        }
        if total > interval * 2 {
            warn!("too many iterations while acquiring song title!");
            break;
        }
        total += len;
    }
    Ok(Body::with(title))
}

pub async fn get_favorites(req: Request<State>) -> Result {
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            SELECT
                station.*,
                station_status.is_restricted,
                station_status.is_broken,
                station_status.is_no_track_info,
                station_status.is_hidden,
                station_status.is_icon,
                station_stats.playtime,
                true as is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                    AND favorite.account_id = {account_id}
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                LEFT JOIN station_stats
                    ON station.id = station_stats.station_id
                    AND station_stats.account_id = {account_id}
                WHERE favorite.account_id = {account_id}
                AND station_status.is_hidden IS NOT true
        "#,
        account_id = account.id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn add_favorite(mut req: Request<State>) -> Result {
    let station_id = req.body_json::<i32>().await?;
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            INSERT INTO
                favorite
                (account_id, station_id)
            VALUES
                ({account_id}, {station_id})
        "#,
        account_id = account.id,
        station_id = station_id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    sqlx::query(&sql).execute(conn.acquire().await?).await?;
    Ok(Body::ok())
}

pub async fn delete_favorite(mut req: Request<State>) -> Result {
    let station_id = req.body_json::<i32>().await?;
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            DELETE FROM
                favorite
            WHERE account_id = {account_id}
            AND station_id = {station_id}
        "#,
        account_id = account.id,
        station_id = station_id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    sqlx::query(&sql).execute(conn.acquire().await?).await?;
    Ok(Body::ok())
}

pub async fn get_account_by_id(req: Request<State>) -> Result {
    let account_id = ok_or_throw!(req.param("id"), "no account id found!");
    let sql = format!(
        r#"
            SELECT
                account.*,
                (
                    SELECT
                        sum(playtime)
                    FROM get_playtime(account.id)
                )
                AS playtime
                FROM account
                WHERE account.id = {account_id}
        "#,
        account_id = account_id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Account>(&sql)
        .fetch_optional(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_station_by_id(req: Request<State>) -> Result {
    let station_id = ok_or_throw!(req.param("id"), "no station id found!");
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            SELECT
                station.*,
                station_status.is_restricted,
                station_status.is_broken,
                station_status.is_no_track_info,
                station_status.is_hidden,
                station_status.is_icon,
                station_stats.playtime,
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END
                AS is_favorite,
                (
                    SELECT
                        count(*)
                        FROM favorite
                        WHERE favorite.station_id = {station_id}
                )
                AS likes
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                    AND favorite.account_id = {account_id}
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                LEFT JOIN station_stats
                    ON station.id = station_stats.station_id
                    AND station_stats.account_id = {account_id}
                WHERE station.id = {station_id}
                AND station_status.is_hidden IS NOT true
        "#,
        account_id = account.id,
        station_id = station_id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::StationDetail>(&sql)
        .fetch_optional(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_group(req: Request<State>) -> Result {
    let group_id = ok_or_throw!(req.param("id"), "no group id was provided!");
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            SELECT
                station_group.*
                FROM station_group
                WHERE station_group.id = {group_id}
        "#,
        group_id = group_id,
    );
    let group = some_or_throw!(
        sqlx::query_as::<_, model::StationGroup>(&sql)
            .fetch_optional(conn.acquire().await?)
            .await?,
        "no group with id found!"
    );
    let sql = format!(
        r#"
            SELECT
                station.*,
                station_status.is_restricted,
                station_status.is_broken,
                station_status.is_no_track_info,
                station_status.is_hidden,
                station_status.is_icon,
                station_stats.playtime,
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END AS is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                    AND favorite.account_id = {account_id}
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                LEFT JOIN station_stats
                    ON station.id = station_stats.station_id
                    AND station_stats.account_id = {account_id}
                WHERE station.group_id = {group_id}
                AND station_status.is_hidden IS NOT true
        "#,
        account_id = account.id,
        group_id = group_id,
    );
    let stations = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    #[derive(Serialize)]
    struct Result {
        group: model::StationGroup,
        stations: Vec<model::Station>,
    }
    let result = Result { group, stations };
    Ok(Body::with(result))
}

pub async fn get_category(req: Request<State>) -> Result {
    let kind = ok_or_throw!(req.param("kind"), "no kind was provided!");
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let category = ok_or_throw!(Category::from(kind), "invalid category provided!");
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let sql = format!(
        r#"
            SELECT
                station.*,
                station_status.is_icon,
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END AS is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                    AND favorite.account_id = {account_id}
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                LEFT JOIN station_stats
                    ON station.id = station_stats.station_id
                    AND station_stats.account_id = {account_id}
                WHERE station_status.is_hidden IS NOT true
                {category}
                LIMIT 10
        "#,
        account_id = account.id,
        category = ok_or_throw!(category.to_sql(), "cannot parse sql statement!"),
    );
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_countries(req: Request<State>) -> Result {
    let sql = r#"
            SELECT
                country
                FROM station
                WHERE country != ''
                GROUP BY country
                ORDER BY COUNT(*) DESC;
        "#
    .to_string();
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Value>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_languages(req: Request<State>) -> Result {
    let sql = r#"
            SELECT
                UNNEST(languages) AS language
                FROM station
                GROUP BY UNNEST(languages)
                ORDER BY COUNT(*) DESC;
        "#
    .to_string();
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Value>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_tags(req: Request<State>) -> Result {
    let sql = r#"
            SELECT
                UNNEST(tags) AS tag
                FROM station
                GROUP BY UNNEST(tags)
                ORDER BY COUNT(*) DESC
                LIMIT 100;
        "#
    .to_string();
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Value>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn get_devices(req: Request<State>) -> Result {
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            SELECT
                device.*
                FROM device
                WHERE device.account_id = {account_id}
        "#,
        account_id = account.id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Device>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}

pub async fn update_account(mut req: Request<State>) -> Result {
    let updated_account = req.body_json::<model::Account>().await?;
    let account = some_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let sql = format!(
        r#"
            UPDATE
                account
                SET
                    name = '{name}',
                    language = '{language}'
                WHERE account.id = {account_id}
                RETURNING
                    account.*,
                    (
                        SELECT
                            sum(playtime)
                        FROM get_playtime(account.id)
                    )
                    AS playtime
        "#,
        account_id = account.id,
        name = updated_account.name.unwrap_or_default(),
        language = updated_account.language,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Account>(&sql)
        .fetch_one(conn.acquire().await?)
        .await?;
    Ok(Body::with(result))
}
