use serde::Deserialize;
use std::fmt::Write;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use crate::error::Error;
use crate::Result;
use crate::ToAddress;
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
        write!(
            url,
            "{}://{}:{}",
            if self.is_tls() { "https" } else { "http" },
            self.hostname,
            self.port
        )?;
        Ok(url)
    }
}

impl ToAddress for Server {
    fn to_address(&self) -> Result<String> {
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
pub struct Mail {
    pub provider: String,
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Auth {
    pub cost: u32,
    pub salt: [u8; 16],
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: Server,
    pub database: Database,
    pub mail: Mail,
    pub auth: Auth,
}

impl Config {
    pub fn acquire() -> Result<Self> {
        let mut config_file = Self::get_global();
        let local_file = Self::get_local();
        if local_file.is_some() {
            config_file = local_file;
        }
        match config_file {
            Some(file) => {
                let raw = fs::read_to_string(&file)?;
                let config: Self = toml::from_str(&raw)?;
                Ok(config)
            }
            None => Err(Error::new("unable to determine config file!")),
        }
    }
    fn get_local() -> Option<PathBuf> {
        let local_file = Path::new("config.toml").to_path_buf();
        if !local_file.exists() {
            return None;
        }
        Some(local_file)
    }
    fn get_global() -> Option<PathBuf> {
        let mut global_file = match dirs::config_dir() {
            Some(file) => file,
            None => return None,
        };
        global_file.push(APP_NAME);
        global_file.push("config.toml");
        if !global_file.exists() {
            return None;
        }
        Some(global_file)
    }
}
