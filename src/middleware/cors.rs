pub struct Cors {
    origin: String,
}

impl Cors {
    #[must_use]
    pub fn new(origin: &str) -> Self {
        Self {
            origin: origin.into(),
        }
    }
}

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for Cors {
    async fn handle(&self, req: tide::Request<State>, next: tide::Next<'_, State>) -> tide::Result {
        let mut res = next.run(req).await;
        res.insert_header("Access-Control-Allow-Origin", &self.origin);
        res.insert_header("Access-Control-Allow-Headers", "*");
        res.insert_header("Access-Control-Allow-Methods", "*");
        Ok(res)
    }
}
