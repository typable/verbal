use serde::{Deserialize};
use regex::Regex;

use crate::common::Station;
use crate::adapter::Adapter;

#[derive(Debug, Deserialize, Clone)]
pub struct StationAdapter {
    pub stationuuid: String,
    pub name: String,
    pub url: String,
    pub votes: i64,
    pub favicon: String,
    pub homepage: String,
    pub tags: String,
    pub clicktrend: i64,
    pub clickcount: i64,
    pub countrycode: String,
    pub languagecodes: String,
    pub state: String,
}

impl Adapter<Station> for StationAdapter {
    fn populate(self, mut target: Station) -> Station {
        target.id = self.stationuuid;
        target.name = self.name;
        target.stream_url = upgrade_to_https(self.url);
        target.votes = self.votes;
        target.favicon = self.favicon;
        target.homepage = self.homepage;
        target.tags = to_array(self.tags);
        target.click_trend = self.clicktrend;
        target.click_count = self.clickcount;
        target.country = self.countrycode;
        target.languages = to_array(self.languagecodes);
        target.state = self.state;
        target
    }
}

fn to_array(value: String) -> Vec<String> {
    value.split(",")
        .map(str::to_string)
        .filter(|tag| tag.trim().len() > 0)
        .collect::<Vec<String>>()
}

fn upgrade_to_https(url: String) -> String {
    if Regex::new("^http://")
        .unwrap()
        .is_match(&url)
        {
            /* TODO: include in config struct */
            return format!("https://api.radio.typable.dev/pass?redirect={}", &url);
        }
    url
}
