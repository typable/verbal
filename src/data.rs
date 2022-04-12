use serde::Serialize;

use crate::model;
use crate::utils::upgrade_to_https;

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

impl Into<Station> for model::Station {
    fn into(self) -> Station {
        Station {
            uuid: self.uuid,
            name: self.name,
            stream_url: upgrade_to_https(self.stream_url),
            votes: self.votes,
            favicon: self.favicon,
            homepage: self.homepage,
            tags: self.tags,
            country: self.country,
            languages: self.languages,
            state: self.state,
            is_favorite: false,
        }
    }
}
