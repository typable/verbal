use serde::Deserialize;

use crate::utils::{to_array, upgrade_to_https};
use crate::models::Station;

#[derive(Debug, Deserialize)]
pub struct StationAdapter {
    pub stationuuid: String,
    pub name: String,
    pub url: String,
    pub votes: i32,
    pub favicon: String,
    pub homepage: String,
    pub tags: String,
    pub countrycode: String,
    pub languagecodes: String,
    pub state: String,
}

impl Into<Station> for StationAdapter {
    fn into(self) -> Station {
        Station {
            id: 0,
            uuid: self.stationuuid,
            name: self.name,
            stream_url: upgrade_to_https(self.url),
            votes: self.votes,
            favicon: Some(self.favicon),
            homepage: Some(self.homepage),
            tags: to_array(self.tags),
            country: Some(self.countrycode),
            languages: to_array(self.languagecodes),
            state: Some(self.state),
        }
    }
}
