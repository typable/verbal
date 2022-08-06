use env_logger::Builder;
use env_logger::Target;
use log::LevelFilter;
use std::process;

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

pub const APP_NAME: &str = "verbal";

pub type Result<T> = std::result::Result<T, Error>;

pub trait IntoSql {
    fn into_sql(self) -> Result<String>;
}

pub fn init_logger() {
    Builder::new()
        .format_timestamp_secs()
        .filter_module(APP_NAME, LevelFilter::Info)
        .target(Target::Stdout)
        .init();
}

pub fn abort(err: &Error) -> ! {
    error!("{}", err);
    process::exit(1)
}
