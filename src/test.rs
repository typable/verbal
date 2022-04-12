// #[macro_use]
// extern crate diesel;

// use diesel::pg::PgConnection;
// use diesel::prelude::*;

// mod api;
// mod data;
// mod error;
// mod model;
// mod rest;
// mod schema;
// mod utils;

// use api::{RadioBrowserApi, Search};
// use model::*;
// use schema::account::dsl::*;

// #[async_std::main]
// async fn main() {
//     let database_url = "postgres://typable:De24Si98@192.168.2.3:9748/verbal";
//     let conn = PgConnection::establish(&database_url).expect("Unable to connect to database!");
//     let results = account
//         .load::<Account>(&conn)
//         .expect("Unable to load model!");
//     for item in results {
//         println!("{:?}", item);
//     }
//     let mut search = Search::default();
//     search.name = "bbc".into();
//     match RadioBrowserApi::search(search).await {
//         Ok(result) => println!("{:#?}", result),
//         Err(err) => println!("{}", err),
//     }
// }

mod model;

use sqlx::postgres::PgPool;

#[async_std::main]
async fn main() {
    let database_url = "postgres://typable:De24Si98@192.168.2.3:9748/verbal?sslmode=disable";
    let pool = PgPool::connect(&database_url).await.unwrap();
    let accounts = sqlx::query_as::<_, model::Account>("SELECT * FROM account")
        .fetch_all(&pool)
        .await
        .unwrap();
    println!("{:#?}", accounts);
}
