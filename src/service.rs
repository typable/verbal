use crate::error::Result;
use crate::api::{RadioBrowserApi, Search};
use crate::models::Station;

#[derive(Clone)]
pub struct Service {}

impl Service {
    pub fn new() -> Self {
        Self {}
    }
    
    pub async fn search(&self, search: Search) -> Result<Vec<Station>> {
        RadioBrowserApi::search(search).await
    }
}
