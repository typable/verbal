use serde::Serialize;

use crate::error::Error;

#[derive(Debug, Clone, Serialize)]
pub struct Body<T, E> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<E>,
}

impl Body<(), ()> {
    pub fn ok() -> tide::Response {
        Self {
            ok: true,
            data: None,
            error: None,
        }
        .into()
    }
}

impl<T: Serialize> Body<T, ()> {
    pub fn with(data: T) -> tide::Response {
        Self {
            ok: true,
            data: Some(data),
            error: None,
        }
        .into()
    }
}

impl Body<(), Error> {
    pub fn throw(message: &str) -> tide::Response {
        Self {
            ok: false,
            data: None,
            error: Some(Error::new(message)),
        }
        .into()
    }
}

impl<T: Serialize, E: Serialize> From<Body<T, E>> for tide::Response {
    fn from(body: Body<T, E>) -> Self {
        tide::Response::builder(200)
            .body(tide::Body::from_json(&body).expect("failed to convert body to response!"))
            .build()
    }
}
