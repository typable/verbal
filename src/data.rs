use serde::Deserialize;
use serde::Serialize;

use crate::model;
use crate::rest;
use crate::utils::to_array;
use crate::utils::upgrade_to_https;

#[derive(Debug, Default, Deserialize)]
pub struct Song {
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct Account {
    pub username: Option<String>,
    pub language: String,
    pub is_playback_history: bool,
}

impl From<model::Account> for Account {
    fn from(model: model::Account) -> Self {
        Self {
            username: model.username,
            language: model.language,
            is_playback_history: model.is_playback_history,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct Station {
    pub uuid: String,
    pub name: String,
    pub stream_url: String,
    pub votes: i32,
    pub favicon: Option<String>,
    pub homepage: Option<String>,
    pub tags: Vec<String>,
    pub country: Option<String>,
    pub languages: Vec<String>,
    pub state: Option<String>,
    pub is_favorite: bool,
}

impl From<model::Station> for Station {
    fn from(model: model::Station) -> Self {
        Self {
            uuid: model.uuid,
            name: model.name,
            stream_url: upgrade_to_https(model.stream_url),
            votes: model.votes,
            favicon: model.favicon,
            homepage: model.homepage,
            tags: model.tags,
            country: model.country,
            languages: model.languages,
            state: model.state,
            is_favorite: false,
        }
    }
}

impl From<rest::Station> for Station {
    fn from(rest: rest::Station) -> Self {
        Self {
            uuid: rest.stationuuid,
            name: rest.name,
            stream_url: upgrade_to_https(rest.url),
            votes: rest.votes,
            favicon: Some(rest.favicon),
            homepage: Some(rest.homepage),
            tags: to_array(rest.tags),
            country: Some(rest.countrycode),
            languages: to_array(rest.languagecodes),
            state: Some(rest.state),
            is_favorite: false,
        }
    }
}
