use env_logger::Builder;
use env_logger::Target;
use log::LevelFilter;

pub mod error;
pub mod middleware;
pub mod model;
pub mod route;

mod config;
mod response;
mod server;

pub use config::Config;
pub use response::Response;
pub use server::Server;

use error::Error;

#[macro_use]
extern crate log;

#[macro_export]
macro_rules! abort {
    ($message:expr) => {{
        error!("{}", $message);
        std::process::exit(1)
    }};
    ($message:expr, $err:expr) => {{
        error!("{} Reason: {}", $message, $err);
        std::process::exit(1)
    }};
}

#[macro_export]
macro_rules! unwrap_result_or_abort {
    ($target:expr, $message:expr) => {{
        $target.unwrap_or_else(|err| abort!($message, &err))
    }};
}

#[macro_export]
macro_rules! unwrap_option_or_abort {
    ($target:expr, $message:expr) => {{
        $target.unwrap_or_else(|| abort!($message))
    }};
}

#[macro_export]
macro_rules! unwrap_result_or_throw {
    ($target:expr, $message:expr) => {{
        match $target {
            Ok(target) => target,
            Err(err) => {
                error!("{}\n{}", $message, err);
                return $crate::Response::throw($message);
            }
        }
    }};
}

#[macro_export]
macro_rules! unwrap_option_or_throw {
    ($target:expr, $message:expr) => {{
        match $target {
            Some(target) => target,
            None => {
                error!("{}", $message);
                return $crate::Response::throw($message);
            }
        }
    }};
}

pub const APP_NAME: &str = "verbal";

pub type Result<T> = std::result::Result<T, Error>;

pub trait ToSql {
    fn to_sql(&self) -> Result<String>;
}

pub trait ToUrl {
    fn to_url(&self) -> Result<String>;
}

pub enum Category {
    Playtime,
    Latest,
}

impl Category {
    pub fn from(kind: &str) -> Result<Self> {
        match kind {
            "playtime" => Ok(Self::Playtime),
            "latest" => Ok(Self::Latest),
            _ => Err(Error::new("not a valid category!")),
        }
    }
}

impl ToSql for Category {
    fn to_sql(&self) -> Result<String> {
        Ok(match self {
            Self::Playtime => "AND station_stats.playtime > 0 ORDER BY station_stats.playtime DESC",
            Self::Latest => "AND station_stats.playtime > 0 ORDER BY station_stats.latest_at DESC",
        }
        .to_string())
    }
}

pub fn init_logger() {
    Builder::new()
        .format_timestamp_secs()
        .filter_module(APP_NAME, LevelFilter::Info)
        .target(Target::Stdout)
        .init();
}
