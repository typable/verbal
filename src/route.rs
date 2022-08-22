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
