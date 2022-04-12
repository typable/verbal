use crate::api::{RadioBrowserApi, Search};
use crate::data;
use crate::error::{Error, ErrorKind, Result};
use crate::model;

pub struct Service {}

impl Service {
    pub async fn search(search: Search, req: tide::Request<()>) -> Result<Vec<data::Station>> {
        // let conn = req.pg_conn().await.unwrap();
        // let rest = match RadioBrowserApi::search(search).await {
        //     Ok(rest) => rest,
        //     Err(err) => return Err(err),
        // };
        // let (account, _) = req.ext::<(model::Account, model::Device)>().unwrap();
        // let likes = schema::like::dsl::like
        //     .filter(schema::like::account_id.eq(account.id))
        //     .load::<model::Like>(&conn)
        //     .unwrap();
        // let data = rest
        //     .iter()
        //     .cloned()
        //     .map(|item| {
        //         let mut data: data::Station = item.clone().into();
        //         data.is_favorite = likes.iter().any(|like| like.station_id == item.stationuuid);
        //         data
        //     })
        //     .collect::<Vec<data::Station>>();
        // Ok(data)
        Err(Error::new(
            ErrorKind::Arguments,
            "No station uuid provided!",
        ))
    }

    pub async fn get_favorites(req: tide::Request<()>) -> Result<Vec<data::Station>> {
        // let conn = req.pg_conn().await.unwrap();
        // let (account, _) = req.ext::<(model::Account, model::Device)>().unwrap();
        // let likes = schema::like::dsl::like
        //     .filter(schema::like::account_id.eq(account.id))
        //     .load::<model::Like>(&conn)
        //     .unwrap();
        // let uuids = likes
        //     .iter()
        //     .map(|like| &like.station_id)
        //     .cloned()
        //     .collect::<Vec<String>>();
        // let rest = match RadioBrowserApi::by_uuids(uuids).await {
        //     Ok(rest) => rest,
        //     Err(err) => return Err(err),
        // };
        // let data = rest
        //     .iter()
        //     .cloned()
        //     .map(|item| {
        //         let mut data: data::Station = item.clone().into();
        //         data.is_favorite = true;
        //         data
        //     })
        //     .collect::<Vec<data::Station>>();
        // Ok(data)
        Err(Error::new(
            ErrorKind::Arguments,
            "No station uuid provided!",
        ))
    }

    pub async fn add_favorite(req: tide::Request<()>) -> Result<()> {
        // let conn = req.pg_conn().await.unwrap();
        // // let (account, _) = req.ext::<(model::Account, model::Device)>().unwrap();
        // let uuid = match req.body_json::<String>().await {
        //     Ok(body) => body,
        //     Err(_) => return Err(Error::new(ErrorKind::Arguments, "No station uuid provided!")),
        // };
        // println!("{}", uuid);
        // match diesel::insert_into(schema::like::dsl::like)
        //     .values(vec![
        //         (schema::like::account_id.eq(9), schema::like::station_id.eq(uuid)),
        //     ])
        //     .execute(&conn) {
        //         Ok(_) => Ok(()),
        //         Err(err) => Err(Error::new(ErrorKind::Query, &err.to_string())),
        //     }
        Err(Error::new(
            ErrorKind::Arguments,
            "No station uuid provided!",
        ))
    }
}
