use sqlx::postgres::Postgres;
use sqlx::prelude::*;
use tide_sqlx::SQLxRequestExt;

use crate::api::{RadioBrowserApi, Search};
use crate::data;
use crate::error::{Error, ErrorKind, Result};
use crate::model;

pub struct Service {}

impl Service {
    pub async fn search(search: Search, req: tide::Request<()>) -> Result<Vec<data::Station>> {
        let account = req.ext::<model::Account>().unwrap();
        let rest = match RadioBrowserApi::search(search).await {
            Ok(rest) => rest,
            Err(err) => return Err(err),
        };
        let query = format!(
            "
                SELECT *
                    FROM \"like\"
                    WHERE \"like\".account_id = '{}'
            ",
            &account.id,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let likes = sqlx::query_as::<_, model::Like>(&query)
            .fetch_all(conn.acquire().await.unwrap())
            .await
            .unwrap();
        let data = rest
            .iter()
            .cloned()
            .map(|item| {
                let mut data: data::Station = item.clone().into();
                data.is_favorite = likes.iter().any(|like| like.station_id == item.stationuuid);
                data
            })
            .collect::<Vec<data::Station>>();
        Ok(data)
    }

    pub async fn get_favorites(req: tide::Request<()>) -> Result<Vec<data::Station>> {
        let account = req.ext::<model::Account>().unwrap();
        let query = format!(
            "
                SELECT *
                    FROM \"like\"
                    WHERE \"like\".account_id = '{}'
            ",
            &account.id,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let likes = sqlx::query_as::<_, model::Like>(&query)
            .fetch_all(conn.acquire().await.unwrap())
            .await
            .unwrap();
        let uuids = likes
            .iter()
            .map(|like| &like.station_id)
            .cloned()
            .collect::<Vec<String>>();
        let rest = match RadioBrowserApi::by_uuids(uuids).await {
            Ok(rest) => rest,
            Err(err) => return Err(err),
        };
        let data = rest
            .iter()
            .cloned()
            .map(|item| {
                let mut data: data::Station = item.clone().into();
                data.is_favorite = true;
                data
            })
            .collect::<Vec<data::Station>>();
        Ok(data)
    }

    pub async fn add_favorite(mut req: tide::Request<()>) -> Result<()> {
        let uuid = match req.body_json::<String>().await {
            Ok(body) => body,
            Err(_) => {
                return Err(Error::new(
                    ErrorKind::Arguments,
                    "No station uuid provided!",
                ))
            }
        };
        let account = req.ext::<model::Account>().unwrap();
        let query = format!(
            "
                INSERT INTO \"like\"
                    (account_id, station_id)
                    VALUES
                    ({}, '{}')
            ",
            &account.id, &uuid,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        match sqlx::query(&query)
            .execute(conn.acquire().await.unwrap())
            .await
        {
            Ok(_) => Ok(()),
            Err(err) => Err(Error::new(ErrorKind::Query, &err.to_string())),
        }
    }
}
