#[macro_use]
extern crate log;

pub mod body;
pub mod config;
pub mod error;
pub mod macros;
pub mod messages;
pub mod middleware;
pub mod models;
pub mod queries;
pub mod routes;
pub mod server;
pub mod utils;

pub mod prelude {
    pub use crate::abort;
    pub use crate::body::Body;
    pub use crate::config::Config;
    pub use crate::ok_or_abort;
    pub use crate::ok_or_throw;
    pub use crate::server::Server;
    pub use crate::server::State;
    pub use crate::some_or_abort;
    pub use crate::some_or_throw;
    pub use crate::Result;
}

pub const APP_NAME: &str = "verbal";

pub type Result<T> = std::result::Result<T, error::Error>;

pub trait ToSql {
    fn to_sql(&self) -> Result<String>;
}

pub trait ToUrl {
    fn to_url(&self) -> Result<String>;
}

pub trait ToAddress {
    fn to_address(&self) -> Result<String>;
}
