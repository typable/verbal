use crate::error::Error;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Response<T, E> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<E>,
}

impl Response<(), ()> {
    pub fn respond(body: Result<tide::Body, tide::Error>) -> tide::Result {
        Ok(tide::Response::builder(200).body(body.unwrap()).build())
    }
}

impl<T> Response<T, ()>
where
    T: Serialize,
{
    pub fn with(data: T) -> tide::Result {
        Response::respond(tide::Body::from_json(&Self {
            ok: true,
            data: Some(data),
            error: None,
        }))
    }
}

impl Response<(), Error> {
    pub fn throw(message: &str) -> tide::Result {
        Response::respond(tide::Body::from_json(&Self {
            ok: false,
            data: None,
            error: Some(Error::new(message)),
        }))
    }
}
