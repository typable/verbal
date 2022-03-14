
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use regex::Regex;
use rand::{distributions::Alphanumeric, Rng};

use verbal::model::Query;
use verbal::adapter::Adapter;
use verbal::Utils;

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct Account {
    pub username: Option<String>,
    pub language: String,
    pub is_playback_history: bool,
}

impl Default for Account {
    fn default() -> Self {
        Self {
            username: None,
            language: "en".into(),
            is_playback_history: true,
        }
    }
}

impl Query for Account {
    fn into_keys(&self) -> String {
        format!("
            username,
            language,
            is_playback_history,
        ")
    }
    fn into_values(&self) -> String {
        format!(
            "
                {},
                '{}',
                {},
            ",
            Utils::null(&self.username),
            &self.language,
            &self.is_playback_history,
        )
    }
    fn into_update(&self) -> String {
        format!(
            "
                username = {},
                language = '{}',
                is_playback_history = {},
            ",
            Utils::null(&self.username),
            &self.language,
            &self.is_playback_history,
        )
    }
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct Favorite {
    pub station_id: String,
    pub account_id: i32,
}

impl Favorite {
    pub fn new(station_id: &str, account_id: i32) -> Self {
        Self { station_id: station_id.into(), account_id }
    }
}

impl Query for Favorite {
    fn into_keys(&self) -> String {
        format!("
            station_id,
            account_id,
        ")
    }
    fn into_values(&self) -> String {
        format!(
            "
                '{}',
                {},
            ",
            &self.station_id,
            &self.account_id,
        )
    }
    fn into_update(&self) -> String {
        format!(
            "
                station_id = '{}',
                account_id = {},
            ",
            &self.station_id,
            &self.account_id,
        )
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Search {
    pub name: String,
    pub page: Option<i64>,
}

impl Search {
    pub fn into_query(&self) -> String {
        format!(
            "name={}&offset={}&limit=10&order=votes&reverse=true&hidebroken=true",
            &self.name,
            &self.page.unwrap_or(0) * 10,
        )
    }
}

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct Station {
    pub id: String,
    pub name: String,
    pub stream_url: String,
    pub votes: i64,
    pub favicon: String,
    pub homepage: String,
    pub tags: Vec<String>,
    pub click_trend: i64,
    pub click_count: i64,
    pub country: String,
    pub languages: Vec<String>,
    pub state: String,
    pub is_favorite: bool,
}

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

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct Code {
    pub code: String,
    pub used: bool,
    pub expired: bool,
}

impl Code {
    pub fn new() -> Self {
        let code = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(6)
            .map(char::from)
            .map(|c| c.to_uppercase().to_string())
            .collect::<String>();
        Self { code, used: false, expired: false }
    }
}
