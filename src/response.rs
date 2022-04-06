use serde::Serialize;
use crate::error::{Error, ErrorKind};

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
    pub fn respond(body: Result<tide::Body, tide::Error>) -> tide::Result {
        Ok(
            tide::Response::builder(200)
                .body(body.unwrap())
                .build()
        )
    }
}

impl<T> Response<T, ()> where T: Serialize {
    pub fn with(data: T) -> tide::Result {
        Response::respond(tide::Body::from_json(&Self { ok: true, data: Some(data), error: None }))
    }
    pub fn with_option(data: Option<T>) -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: true, data, error: None })
    }
}

impl<E> Response<(), E> where E: Serialize {
    pub fn with_error(error: E) -> Result<tide::Body, tide::Error> {
        tide::Body::from_json(&Self { ok: false, data: None, error: Some(error) })
    }
}

impl Response<(), Error> {
    pub fn throw(error_kind: ErrorKind, message: &str) -> tide::Result {
        Response::respond(tide::Body::from_json(&Self { ok: false, data: None, error: Some(Error::new(error_kind, message)) }))
    }
}
