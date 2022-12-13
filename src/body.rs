use serde::Serialize;

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

impl<E: Serialize> Body<(), E> {
    pub fn throw(error: E) -> tide::Response {
        Self {
            ok: false,
            data: None,
            error: Some(error),
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
