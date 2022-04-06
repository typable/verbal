use crate::service::Service;

#[derive(Clone)]
pub struct State {
    pub service: Service,
}

impl State {
    pub fn new() -> Self {
        Self {
            service: Service::new(),
        }
    }
}
