use std::collections::HashMap;

use fancy_regex::Regex;
use tide::http::Method;
use tide::http::StatusCode;

pub struct CacheMiddleware {
    caching: Option<HashMap<String, String>>,
}

impl CacheMiddleware {
    pub fn new(caching: &Option<HashMap<String, String>>) -> Self {
        let mut caching = caching.clone();
        if let Some(caching) = &mut caching {
            let mut invalid_keys = Vec::new();
            for key in caching.keys() {
                if let Err(err) = Regex::new(key) {
                    error!("invalid cache key '{}'! Err: {}", key, err);
                    invalid_keys.push(key.clone());
                }
            }
            for invalid_key in &invalid_keys {
                caching.remove(invalid_key);
            }
        }
        Self { caching }
    }
}

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for CacheMiddleware {
    async fn handle(&self, req: tide::Request<State>, next: tide::Next<'_, State>) -> tide::Result {
        let method = req.method();
        let url = req.url().clone();
        let mut res = next.run(req).await;
        if let Some(caching) = &self.caching {
            if method == Method::Get && res.status() == StatusCode::Ok {
                for (key, value) in caching.iter() {
                    let regex = match Regex::new(key) {
                        Ok(regex) => regex,
                        Err(err) => {
                            error!("invalid cache key '{}'! Err: {}", key, err);
                            continue;
                        }
                    };
                    if regex.is_match(url.path()).unwrap_or_default() {
                        res.insert_header("Cache-Control", value);
                        break;
                    }
                }
            }
        }
        Ok(res)
    }
}
