use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Station {
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
