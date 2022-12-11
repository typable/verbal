use async_std::io::ReadExt;
use fancy_regex::Regex;
use lettre::message::MultiPart;
use lettre::transport::smtp::authentication::Credentials;
use lettre::Message;
use lettre::SmtpTransport;
use lettre::Transport;
use serde::Serialize;
use sqlx::Acquire;
use sqlx::Postgres;
use tide::log::warn;
use tide_sqlx::SQLxRequestExt;

use crate::messages;
use crate::model;
use crate::server::State;
use crate::unwrap_option_or_throw;
use crate::unwrap_result_or_throw;
use crate::Category;
use crate::Response;
use crate::ToSql;
use crate::ToUrl;

pub async fn do_prefetch(_: tide::Request<State>) -> tide::Result {
    Ok(tide::Response::new(200))
}

pub async fn do_register(mut req: tide::Request<State>) -> tide::Result {
    let user = req.ext::<model::User>();
    if user.is_some() {
        return Response::throw(messages::USER_ALREADY_LOGGED_IN);
    }
    let form = req.body_json::<model::RegisterForm>().await?;
    if !Regex::new("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$")
        .unwrap()
        .is_match(&form.email)
        .unwrap_or_default()
    {
        return Response::throw(messages::INVALID_EMAIL);
    }
    if !Regex::new("^(?=.*([A-Z]){1,})(?=.*[!@#$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{8,100}$")
        .unwrap()
        .is_match(&form.password)
        .unwrap_or_default()
    {
        return Response::throw(messages::INVALID_PASSWORD);
    }
    let auth = &req.state().config.auth;
    let hash = match bcrypt::hash_with_salt(&form.password, auth.cost, auth.salt) {
        Ok(hash) => hash,
        Err(err) => {
            error!("unable to generate hash for password! Err: {}", err);
            return Response::throw(messages::INTERNAL_ERROR);
        }
    };
    let hashed_password = hash.to_string();
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
            warn!("user '{}' already exists!", form.email);
            return Response::throw(messages::USER_ALREADY_EXISTS);
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
            return Response::throw(messages::INTERNAL_ERROR);
        }
    };
    let state = req.state();
    let hostname = unwrap_result_or_throw!(state.config.server.to_url(), messages::INTERNAL_ERROR);
    let mail = &state.config.mail;
    let sender = format!("verbal.fm <{}>", mail.email);
    let recipient = format!("{email} <{email}>", email = user.email);
    let verification_url = format!("{}/verify/{}", hostname, verification.code);
    let email = Message::builder()
        .from(sender.parse().unwrap())
        .to(recipient.parse().unwrap())
        .subject("Verify your account")
        .multipart(MultiPart::alternative_plain_html(
            format!(
                "Click to verify your account: {url}",
                url = verification_url
            ),
            format!(
                "Click to verify your account: <a href=\"{url}\">{url}</a>",
                url = verification_url
            ),
        ))
        .unwrap();
    let credentials = Credentials::new(mail.username.clone(), mail.password.clone());
    let mailer = SmtpTransport::relay(&mail.provider)
        .unwrap()
        .credentials(credentials)
        .build();
    match mailer.send(&email) {
        Ok(_) => info!("verification email was sent to {}", user.email),
        Err(err) => error!(
            "failed to send verification email to {}! Err: {}",
            user.email, err
        ),
    }
    Response::ok()
}

pub async fn do_login(mut req: tide::Request<State>) -> tide::Result {
    let user = req.ext::<model::User>();
    if user.is_some() {
        return Response::throw(messages::USER_ALREADY_LOGGED_IN);
    }
    let form = req.body_json::<model::LoginForm>().await?;
    let auth = &req.state().config.auth;
    let hash = match bcrypt::hash_with_salt(&form.password, auth.cost, auth.salt) {
        Ok(hash) => hash,
        Err(err) => {
            error!("unable to generate hash for password! Err: {}", err);
            return Response::throw(messages::INTERNAL_ERROR);
        }
    };
    let hashed_password = hash.to_string();
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
            warn!("user '{}' does not exist or password is wrong!", form.email);
            return Response::throw(messages::USER_DOES_NOT_EXIST_OR_PASSWORD_IS_WRONG);
        }
    };
    if !user.verified {
        warn!("user '{}' is not verified!", user.email);
        return Response::throw(messages::USER_IS_NOT_VERIFIED);
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
            return Response::throw(messages::INTERNAL_ERROR);
        }
    };
    Response::with(session)
}

pub async fn do_verify(mut req: tide::Request<State>) -> tide::Result {
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
            warn!("invalid verification for code '{}'!", form.code);
            return Response::throw(messages::INVALID_VERIFICATION);
        }
    };
    if user.verified {
        return Response::throw(messages::USER_ALREADY_VERIFIED);
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
        return Response::throw(messages::INTERNAL_ERROR);
    }
    Response::ok()
}

pub async fn get_user(req: tide::Request<State>) -> tide::Result {
    let user = req.ext::<model::User>();
    Response::with(user)
}

pub async fn get_account(req: tide::Request<State>) -> tide::Result {
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    Response::with(account)
}

pub async fn add_account(mut req: tide::Request<State>) -> tide::Result {
    if req.ext::<model::Account>().is_some() {
        return Response::throw("already logged in with another account!");
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
    Response::with(device)
}

pub async fn do_search(req: tide::Request<State>) -> tide::Result {
    let query = req.query::<model::Query>()?;
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
        conditions = unwrap_result_or_throw!(query.to_sql(), "cannot parse sql statement!"),
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Response::with(result)
}

pub async fn get_song(req: tide::Request<State>) -> tide::Result {
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
        None => return Response::throw("no icy metadata header found!"),
    };
    let interval = match meta_int.parse::<usize>() {
        Ok(interval) => interval * 2,
        Err(_) => return Response::throw("icy metadata interval is not a number!"),
    };
    let mut total = 0;
    let mut bytes = Vec::new();
    let mut buf = [0; 10000];
    let mut title = None;
    loop {
        let len =
            unwrap_result_or_throw!(response.read(&mut buf).await, "cannot read stream data!");
        bytes.extend_from_slice(&buf);
        if total + len > interval {
            let metadata = String::from_utf8_lossy(&bytes);
            if let Some(cap) =
                unwrap_result_or_throw!(Regex::new("StreamTitle='([^;]*)';"), "cannot parse regex!")
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
    Response::with(title)
}

pub async fn get_favorites(req: tide::Request<State>) -> tide::Result {
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::with(result)
}

pub async fn add_favorite(mut req: tide::Request<State>) -> tide::Result {
    let station_id = req.body_json::<i32>().await?;
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::ok()
}

pub async fn delete_favorite(mut req: tide::Request<State>) -> tide::Result {
    let station_id = req.body_json::<i32>().await?;
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::ok()
}

pub async fn get_account_by_id(req: tide::Request<State>) -> tide::Result {
    let account_id = unwrap_result_or_throw!(req.param("id"), "no account id found!");
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
    Response::with(result)
}

pub async fn get_station_by_id(req: tide::Request<State>) -> tide::Result {
    let station_id = unwrap_result_or_throw!(req.param("id"), "no station id found!");
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::with(result)
}

pub async fn get_group(req: tide::Request<State>) -> tide::Result {
    let group_id = unwrap_result_or_throw!(req.param("id"), "no group id was provided!");
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    let group = unwrap_option_or_throw!(
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
    Response::with(result)
}

pub async fn get_category(req: tide::Request<State>) -> tide::Result {
    let kind = unwrap_result_or_throw!(req.param("kind"), "no kind was provided!");
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    let category = unwrap_result_or_throw!(Category::from(kind), "invalid category provided!");
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
        category = unwrap_result_or_throw!(category.to_sql(), "cannot parse sql statement!"),
    );
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_all(conn.acquire().await?)
        .await?;
    Response::with(result)
}

pub async fn get_countries(req: tide::Request<State>) -> tide::Result {
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
    Response::with(result)
}

pub async fn get_languages(req: tide::Request<State>) -> tide::Result {
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
    Response::with(result)
}

pub async fn get_tags(req: tide::Request<State>) -> tide::Result {
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
    Response::with(result)
}

pub async fn get_devices(req: tide::Request<State>) -> tide::Result {
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::with(result)
}

pub async fn update_account(mut req: tide::Request<State>) -> tide::Result {
    let updated_account = req.body_json::<model::Account>().await?;
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
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
    Response::with(result)
}
