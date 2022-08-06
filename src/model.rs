use serde::Deserialize;
use serde::Serialize;
use sqlx::FromRow;
use std::fmt::Write;

use crate::IntoSql;
use crate::Result;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: i32,
    pub name: Option<String>,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Device {
    pub id: i32,
    pub uid: String,
    pub account_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Station {
    pub id: i32,
    pub uid: String,
    pub name: String,
    pub url: String,
    pub icon: Option<String>,
    pub homepage: Option<String>,
    pub tags: Option<Vec<String>>,
    pub country: Option<String>,
    pub state: Option<String>,
    pub languages: Option<Vec<String>>,
    pub score: i32,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Favorite {
    pub id: i32,
    pub account_id: i32,
    pub station_id: String,
}

#[derive(Debug, Default, Deserialize)]
pub struct Query {
    pub name: String,
    pub tags: Option<Vec<String>>,
    pub country: Option<String>,
    pub language: Option<String>,
    pub page: Option<i32>,
}

impl IntoSql for Query {
    fn into_sql(self) -> Result<String> {
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
                write!(sql, "LOWER('{}')", tag)?;
            }
            writeln!(sql, "]")?;
        }
        if let Some(country) = &self.country {
            writeln!(sql, "AND station.country = UPPER('{}')", country)?;
        }
        if let Some(language) = &self.language {
            writeln!(sql, "AND station.languages = array[LOWER('{}')]", language)?;
        }
        Ok(sql)
    }
}
