use serde::Serialize;

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
