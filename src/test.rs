mod common;
mod error;
mod backend;
mod adapter;

use backend::api::{RadioBrowserApi, Search};

#[async_std::main]
async fn main() {
    let mut search = Search::default();
    search.name = "bbc".into();
    match RadioBrowserApi::search(search).await {
        Ok(result) => println!("{:#?}", result),
        Err(err) => println!("{}", err),
    }
}
