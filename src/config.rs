use serde::Deserialize;
use std::fmt::Write;
use std::fs;

use crate::error::Error;
use crate::Result;
use crate::ToUrl;
use crate::APP_NAME;

#[derive(Debug, Clone, Deserialize)]
pub struct Server {
    pub hostname: String,
    pub port: i32,
    pub cert_path: Option<String>,
    pub key_path: Option<String>,
    pub options: Options,
}

impl Server {
    pub fn is_tls(&self) -> bool {
        if !443.eq(&self.port) {
            return false;
        }
        if self.cert_path.is_none() || self.key_path.is_none() {
            warn!("the port 443 is usually used for TLS only!");
            return false;
        }
        true
    }
}

impl ToUrl for Server {
    fn to_url(&self) -> Result<String> {
        let mut url = String::new();
        write!(url, "{}:{}", self.hostname, self.port)?;
        Ok(url)
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Options {
    pub origin: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Database {
    pub hostname: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub database: String,
}

impl ToUrl for Database {
    fn to_url(&self) -> Result<String> {
        let mut url = String::new();
        write!(
            url,
            "postgres://{}:{}@{}:{}/{}?sslmode=disable",
            self.username, self.password, self.hostname, self.port, self.database,
        )?;
        Ok(url)
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: Server,
    pub database: Database,
}

impl Config {
    pub fn acquire() -> Result<Self> {
        let mut config_path = match dirs::config_dir() {
            Some(config_path) => config_path,
            None => return Err(Error::new("unable to determine config path!")),
        };
        config_path.push(APP_NAME);
        config_path.push("config.toml");
        let raw = fs::read_to_string(&config_path)?;
        let config: Self = toml::from_str(&raw)?;
        Ok(config)
    }
}
