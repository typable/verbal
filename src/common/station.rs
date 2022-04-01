use serde::{Deserialize, Serialize};

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
}
