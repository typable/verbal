use async_std::io::ReadExt;
use regex::Regex;
use sqlx::postgres::Postgres;
use sqlx::prelude::*;
use tide_sqlx::SQLxRequestExt;

use crate::api::{RadioBrowserApi, Search};
use crate::data::{self, Song};
use crate::error::Error;
use crate::model;
use crate::Result;

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

    pub async fn get_song(song: Song) -> Result<Option<String>> {
        let mut response = match surf::get(&song.url).header("icy-metadata", "1").await {
            Ok(response) => response,
            Err(_) => return Err(Error::new("Unable to fetch metadata!")),
        };
        let meta_int = match response.header("icy-metaint") {
            Some(header) => header.as_str(),
            None => return Err(Error::new("Invalid icy metadata!")),
        };
        let interval = match meta_int.parse::<usize>() {
            Ok(value) => value * 2,
            Err(_) => return Err(Error::new("Unable to parse icy metadata!")),
        };
        let mut count = 0;
        let mut bytes = vec![];
        let mut buf = [0; 10000];
        let mut data = None;
        loop {
            let len = response.read(&mut buf).await.unwrap();
            bytes.extend_from_slice(&buf);
            if count + len > interval {
                let metadata = String::from_utf8_lossy(&bytes);
                if let Some(cap) = Regex::new("StreamTitle='([^;]*)';")
                    .unwrap()
                    .captures_iter(&metadata)
                    .next()
                {
                    data = Some(cap[1].to_string());
                }
                break;
            }
            count += len;
        }
        Ok(data)
    }

    pub async fn get_likes(req: tide::Request<()>) -> Result<Vec<data::Station>> {
        let account = req.ext::<model::Account>().unwrap();
        let query = format!(
            "
                SELECT *
                    FROM \"like\"
                    WHERE account_id = '{}'
                    ORDER BY created_at DESC
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
        let rests = match RadioBrowserApi::by_uuids(uuids).await {
            Ok(rest) => rest,
            Err(err) => return Err(err),
        };
        let mut data = vec![];
        for like in likes {
            for rest in &rests {
                if like.station_id.eq(&rest.stationuuid) {
                    let mut item: data::Station = rest.clone().into();
                    item.is_favorite = true;
                    data.push(item);
                    break;
                }
            }
        }
        Ok(data)
    }

    pub async fn add_like(mut req: tide::Request<()>) -> Result<()> {
        let uuid = match req.body_json::<String>().await {
            Ok(body) => body,
            Err(_) => return Err(Error::new("No station uuid provided!")),
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
            Err(err) => Err(Error::new(&err.to_string())),
        }
    }

    pub async fn remove_like(mut req: tide::Request<()>) -> Result<()> {
        let uuid = match req.body_json::<String>().await {
            Ok(body) => body,
            Err(_) => return Err(Error::new("No station uuid provided!")),
        };
        let account = req.ext::<model::Account>().unwrap();
        let query = format!(
            "
                DELETE FROM \"like\"
                    WHERE account_id = {}
                    AND station_id = '{}'
            ",
            &account.id, &uuid,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        match sqlx::query(&query)
            .execute(conn.acquire().await.unwrap())
            .await
        {
            Ok(_) => Ok(()),
            Err(err) => Err(Error::new(&err.to_string())),
        }
    }
}
