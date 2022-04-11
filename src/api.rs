use serde::Deserialize;
use std::fmt;

use crate::error::{Error, ErrorKind, Result};
use crate::rest;

const API_URLS: [&str; 3] = [
    "https://de1.api.radio-browser.info",
    "https://fr1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
];

#[derive(Debug, Default, Deserialize)]
pub struct Search {
    pub name: String,
    pub page: Option<i64>,
}

impl fmt::Display for Search {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "name={}&offset={}&limit=10&order=votes&reverse=true&hidebroken=true",
            &self.name,
            &self.page.unwrap_or(0) * 10,
        )
    }
}

pub struct RadioBrowserApi;

impl RadioBrowserApi {
    pub async fn search(search: Search) -> Result<Vec<rest::Station>> {
        let uri = format!("/json/stations/search?{}", &search);
        let mut response = match RadioBrowserApi::fetch(&uri).await {
            Ok(response) => response,
            Err(err) => return Err(err),
        };
        match response.body_json::<Vec<rest::Station>>().await {
            Ok(data) => Ok(data),
            Err(err) => Err(Error::new(ErrorKind::Parse, &err.to_string())),
        }
    }

    pub async fn by_uuids(uuids: Vec<String>) -> Result<Vec<rest::Station>> {
        let uri = format!("/json/stations/byuuid?uuids={}", &uuids.join(","));
        let mut response = match RadioBrowserApi::fetch(&uri).await {
            Ok(response) => response,
            Err(err) => return Err(err),
        };
        match response.body_json::<Vec<rest::Station>>().await {
            Ok(data) => Ok(data),
            Err(err) => Err(Error::new(ErrorKind::Parse, &err.to_string())),
        }
    }

    async fn fetch(uri: &str) -> Result<surf::Response> {
        let mut successful_response = None;
        for api_url in API_URLS {
            let url = format!("{}{}", &api_url, &uri,);
            match surf::get(&url).await {
                Ok(response) => {
                    successful_response = Some(response);
                    break;
                }
                Err(err) => println!("{}", Error::new(ErrorKind::Fetch, &err.to_string())),
            }
        }
        match successful_response {
            Some(response) => Ok(response),
            None => return Err(Error::new(ErrorKind::Fetch, "All request attempts failed!")),
        }
    }
}
