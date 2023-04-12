use std::fmt::Write;

use serde::Deserialize;
use serde::Serialize;
use sqlx::FromRow;

use crate::prelude::*;

use crate::ToSql;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: i32,
    pub name: Option<String>,
    pub language: String,
    pub playtime: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Device {
    pub id: i32,
    pub uid: String,
    pub name: Option<String>,
    pub account_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Station {
    pub id: i32,
    pub uid: Option<String>,
    pub name: String,
    pub url: String,
    pub icon: Option<String>,
    pub country: Option<String>,
    pub state: Option<String>,
    pub city: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StationDetail {
    pub id: i32,
    pub uid: Option<String>,
    pub name: String,
    pub url: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub homepage: Option<String>,
    pub tags: Option<Vec<String>>,
    pub country: Option<String>,
    pub state: Option<String>,
    pub city: Option<String>,
    pub languages: Option<Vec<String>>,
    pub score: i32,
    pub utc: Option<i32>,
    pub color: Option<String>,
    pub group_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StationGroup {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Favorite {
    pub id: i32,
    pub account_id: i32,
    pub station_id: String,
}

#[derive(Debug, Default, Deserialize)]
pub struct SearchQuery {
    pub name: String,
    pub tags: Option<Vec<String>>,
    pub country: Option<String>,
    pub language: Option<String>,
    pub page: Option<i32>,
}

impl ToSql for SearchQuery {
    fn to_sql(&self) -> Result<String> {
        let mut sql = String::new();
        writeln!(
            sql,
            "WHERE LOWER(station.name) LIKE LOWER('%{}%')",
            self.name
        )?;
        if let Some(tags) = &self.tags {
            write!(sql, "AND station.tags = array[")?;
            for (i, tag) in tags.iter().enumerate() {
                if i > 0 {
                    write!(sql, ", ")?;
                }
                write!(sql, "LOWER('{tag}')")?;
            }
            writeln!(sql, "]")?;
        }
        if let Some(country) = &self.country {
            writeln!(sql, "AND station.country = UPPER('{country}')")?;
        }
        if let Some(language) = &self.language {
            writeln!(sql, "AND station.languages = array[LOWER('{language}')]")?;
        }
        Ok(sql)
    }
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Value(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i32,
    pub name: Option<String>,
    pub email: String,
    pub verified: bool,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Code {
    pub id: i32,
    pub kind: String,
    pub code: String,
    pub user_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: i32,
    pub token: String,
    pub user_id: i32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RegisterForm {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LoginForm {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VerfiyForm {
    pub code: String,
}
