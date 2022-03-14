use std::fmt::Display;
use serde::{ Serialize};

mod config;

pub mod model;
pub mod adapter;
pub mod middleware;

pub use config::Config;

pub struct Utils {}

impl Utils {
    pub fn null<T>(value: &Option<T>) -> String where T: Display {
        match value {
            Some(value) => format!("'{}'", &value),
            None => "NULL".to_string(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct State {
    pub config: Config,
}

impl State {
    pub fn new(config: Config) -> Self {
        Self { config }
    }
}

#[derive(Debug, Serialize)]
pub enum ErrorKind {
    Identity,
    Arguments,
    Query,
    Fetch,
    Parse,
}

#[derive(Debug, Serialize)]
pub struct Error {
    kind: ErrorKind,
    message: String,
}

impl Error {
    pub fn new(kind: ErrorKind, message: &str) -> Self {
        Self { kind, message: message.into() }
    }
}

#[derive(Debug, Serialize)]
pub struct Response<T, E> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<E>,
}

impl Response<(), ()> {
    pub fn success() -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: true, data: None, error: None })
    }
}

impl<T> Response<T, ()> where T: Serialize {
    pub fn with(data: T) -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: true, data: Some(data), error: None })
    }
    pub fn with_option(data: Option<T>) -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: true, data, error: None })
    }
}


impl<E> Response<(), E> where E: Serialize {
    pub fn throw(error: E) -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: false, data: None, error: Some(error) })
    }
}
