use std::fmt;
use serde::{Deserialize, Serialize};

use crate::error::{Result, Error, ErrorKind};
use crate::models::Station;
use crate::adapter::StationAdapter;

const API_URLS: [&str; 3] = [
    "https://de1.api.radio-browser.info",
    "https://fr1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
];

#[derive(Debug, Default, Deserialize, Serialize)]
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

    pub async fn search(search: Search) -> Result<Vec<Station>> {
        let mut successful_response = None;
        for api_url in API_URLS {
            let url = format!(
                "{}/json/stations/search?{}",
                &api_url,
                &search,
            );
            match surf::get(&url).await {
                Ok(response) => {
                    successful_response = Some(response);
                    break;
                },
                Err(err) => println!("{}", Error::new(ErrorKind::Fetch, &err.to_string())),
            }
        }
        let mut response = match successful_response {
            Some(response) => response,
            None => return Err(Error::new(ErrorKind::Fetch, "All request attempts failed!")),
        };
        let adapters = match response.body_json::<Vec<StationAdapter>>().await {
            Ok(adapters) => adapters,
            Err(err) => return Err(Error::new(ErrorKind::Parse, &err.to_string())),
        };
        let mut stations = vec![];
        for adapter in adapters {
            stations.push(adapter.into());
        }
        Ok(stations)
    }

}
