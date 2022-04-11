use diesel::prelude::*;
use tide_diesel::DieselRequestExt;

use crate::api::{RadioBrowserApi, Search};
use crate::data;
use crate::error::Result;
use crate::model;
use crate::schema;

pub struct Service {}

impl Service {
    pub async fn search(search: Search, req: tide::Request<()>) -> Result<Vec<data::Station>> {
        let conn = req.pg_conn().await.unwrap();
        let rest = match RadioBrowserApi::search(search).await {
            Ok(rest) => rest,
            Err(err) => return Err(err),
        };
        let (account, _) = req.ext::<(model::Account, model::Device)>().unwrap();
        let likes = schema::like::dsl::like
            .filter(schema::like::account_id.eq(account.id))
            .load::<model::Like>(&conn)
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
        let conn = req.pg_conn().await.unwrap();
        let (account, _) = req.ext::<(model::Account, model::Device)>().unwrap();
        let likes = schema::like::dsl::like
            .filter(schema::like::account_id.eq(account.id))
            .load::<model::Like>(&conn)
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
}
