use sqlx::query_as;
use sqlx::Acquire;
use sqlx::PgConnection;

use crate::prelude::*;

use crate::error::Error;
use crate::models::SearchQuery;
use crate::ToSql;

type Model = crate::models::StationDetail;

const LIMIT: i32 = 30;

pub async fn get_by_search_query(
    conn: &mut PgConnection,
    query: SearchQuery,
) -> Result<Vec<Model>> {
    let conditions = match query.to_sql() {
        Ok(sql) => sql,
        Err(err) => {
            return Err(Error::new(&format!(
                "unable to create sql for search query! Err: {}",
                err
            )));
        }
    };
    let stations = query_as::<_, Model>(&format!(
        r#"
            SELECT station.* FROM station
            {conditions}
            OFFSET {offset}
            LIMIT {limit}
        "#,
        conditions = conditions,
        offset = query.page.unwrap_or_default() * LIMIT,
        limit = LIMIT,
    ))
    .fetch_all(conn.acquire().await?)
    .await?;
    Ok(stations)
}

pub async fn get_by_id(conn: &mut PgConnection, id: &i32) -> Result<Option<Model>> {
    let station = query_as::<_, Model>(&format!(
        r#"
            SELECT station.* FROM station
            WHERE id = {id}
        "#,
        id = id,
    ))
    .fetch_optional(conn.acquire().await?)
    .await?;
    Ok(station)
}
