use async_std::io::ReadExt;
use regex::Regex;
use sqlx::Acquire;
use sqlx::Postgres;
use tide_sqlx::SQLxRequestExt;

use crate::model;
use crate::unwrap_option_or_throw;
use crate::unwrap_result_or_throw;
use crate::Response;
use crate::ToSql;

pub async fn do_prefetch(_: tide::Request<()>) -> tide::Result {
    Ok(tide::Response::new(200))
}

pub async fn get_account(req: tide::Request<()>) -> tide::Result {
    let account =
        unwrap_option_or_throw!(req.ext::<model::Account>(), "no account in request found!");
    Response::with(account)
}

pub async fn do_search(req: tide::Request<()>) -> tide::Result {
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
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END AS is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
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

pub async fn get_song(req: tide::Request<()>) -> tide::Result {
    let station = req.query::<model::Station>()?;
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
                title = Some(cap[1].to_string());
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

pub async fn get_favorites(req: tide::Request<()>) -> tide::Result {
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
                true as is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
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

pub async fn add_favorite(mut req: tide::Request<()>) -> tide::Result {
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
    Response::with(())
}

pub async fn delete_favorite(mut req: tide::Request<()>) -> tide::Result {
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
    Response::with(())
}

pub async fn get_station(req: tide::Request<()>) -> tide::Result {
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
                CASE
                    WHEN favorite.id IS NULL OR favorite.account_id != {account_id}
                    THEN false
                    ELSE true
                END AS is_favorite
                FROM station
                LEFT JOIN favorite
                    ON station.id = favorite.station_id
                LEFT JOIN station_status
                    ON station.id = station_status.station_id
                WHERE station.id = {station_id}
                AND station_status.is_hidden IS NOT true
        "#,
        account_id = account.id,
        station_id = station_id,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let result = sqlx::query_as::<_, model::Station>(&sql)
        .fetch_optional(conn.acquire().await?)
        .await?;
    Response::with(result)
}

pub async fn get_countries(req: tide::Request<()>) -> tide::Result {
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

pub async fn get_languages(req: tide::Request<()>) -> tide::Result {
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

pub async fn get_tags(req: tide::Request<()>) -> tide::Result {
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

pub async fn get_devices(req: tide::Request<()>) -> tide::Result {
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

pub async fn update_account(mut req: tide::Request<()>) -> tide::Result {
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
                RETURNING *
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
