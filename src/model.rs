use diesel::{Insertable, Queryable};

use crate::schema::station;

#[derive(Debug, Queryable)]
pub struct Account {
    pub id: i32,
    pub username: Option<String>,
    pub language: String,
    pub is_playback_history: bool,
}

#[derive(Debug, Queryable)]
pub struct Device {
    pub id: i32,
    pub token: String,
    pub account_id: i32,
}

#[derive(Debug, Clone, Queryable, Insertable)]
#[table_name = "station"]
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

#[derive(Debug, Queryable)]
pub struct Like {
    pub id: i32,
    pub account_id: i32,
    pub station_id: String,
}

// use rand::{distributions::Alphanumeric, Rng};

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
