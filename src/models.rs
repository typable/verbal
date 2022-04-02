use serde::Serialize;
use diesel::Queryable;

#[derive(Debug, Serialize, Queryable)]
pub struct Account {
    pub id: i32,
    pub username: Option<String>,
    pub language: String,
    pub is_playback_history: bool,
}

#[derive(Debug, Serialize, Queryable)]
pub struct Device {
    pub id: i32,
    pub token: String,
    pub account_id: i32,
}

#[derive(Debug, Serialize, Queryable)]
pub struct Station {
    pub id: i32,
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
}

// use rand::{distributions::Alphanumeric, Rng};

// #[derive(Debug, Deserialize, Serialize, FromRow)]
// pub struct Account {
//     pub username: Option<String>,
//     pub language: String,
//     pub is_playback_history: bool,
// }

// impl Default for Account {
//     fn default() -> Self {
//         Self {
//             username: None,
//             language: "en".into(),
//             is_playback_history: true,
//         }
//     }
// }

// impl Query for Account {
//     fn into_keys(&self) -> String {
//         format!("
//             username,
//             language,
//             is_playback_history,
//         ")
//     }
//     fn into_values(&self) -> String {
//         format!(
//             "
//                 {},
//                 '{}',
//                 {},
//             ",
//             Utils::null(&self.username),
//             &self.language,
//             &self.is_playback_history,
//         )
//     }
//     fn into_update(&self) -> String {
//         format!(
//             "
//                 username = {},
//                 language = '{}',
//                 is_playback_history = {},
//             ",
//             Utils::null(&self.username),
//             &self.language,
//             &self.is_playback_history,
//         )
//     }
// }

// #[derive(Debug, Deserialize, Serialize, FromRow)]
// pub struct Favorite {
//     pub station_id: String,
//     pub account_id: i32,
// }

// impl Favorite {
//     pub fn new(station_id: &str, account_id: i32) -> Self {
//         Self { station_id: station_id.into(), account_id }
//     }
// }

// impl Query for Favorite {
//     fn into_keys(&self) -> String {
//         format!("
//             station_id,
//             account_id,
//         ")
//     }
//     fn into_values(&self) -> String {
//         format!(
//             "
//                 '{}',
//                 {},
//             ",
//             &self.station_id,
//             &self.account_id,
//         )
//     }
//     fn into_update(&self) -> String {
//         format!(
//             "
//                 station_id = '{}',
//                 account_id = {},
//             ",
//             &self.station_id,
//             &self.account_id,
//         )
//     }
// }

// #[derive(Debug, Default, Deserialize, Serialize)]
// pub struct Station {
//     pub id: String,
//     pub name: String,
//     pub stream_url: String,
//     pub votes: i64,
//     pub favicon: String,
//     pub homepage: String,
//     pub tags: Vec<String>,
//     pub click_trend: i64,
//     pub click_count: i64,
//     pub country: String,
//     pub languages: Vec<String>,
//     pub state: String,
//     pub is_favorite: bool,
// }

// #[derive(Debug, Deserialize, Serialize, FromRow)]
// pub struct Code {
//     pub code: String,
//     pub used: bool,
//     pub expired: bool,
// }

// impl Code {
//     pub fn new() -> Self {
//         let code = rand::thread_rng()
//             .sample_iter(&Alphanumeric)
//             .take(6)
//             .map(char::from)
//             .map(|c| c.to_uppercase().to_string())
//             .collect::<String>();
//         Self { code, used: false, expired: false }
//     }
// }
