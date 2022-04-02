use std::fs;
use std::fmt;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Server {
    pub hostname: String,
    pub port: i32,
}

impl fmt::Display for Server {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}:{}",
            self.hostname,
            self.port,
        )
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Database {
    pub hostname: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub database: String,
}

impl fmt::Display for Database {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "postgres://{}:{}@{}:{}/{}?sslmode=disable",
            self.username,
            self.password,
            self.hostname,
            self.port,
            self.database,
        )
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Options {
    pub origin: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: Server,
    pub database: Database,
    pub options: Options,
}

impl Config {
    pub fn from_file(path: &str) -> Result<Self, ron::Error> {
        let raw = fs::read_to_string(path).expect("Unable to locate config.ron file!");
        ron::from_str(&raw)
    }
}
