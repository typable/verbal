use surf;
use sqlx::postgres::PgPool;

mod common;
mod adapter;
mod models;

use adapter::Adapter;
use models::{Station, StationAdapter};

trait IntoInsert {
    fn into_insert(&self) -> String;
}

impl IntoInsert for Station {
    fn into_insert(&self) -> String {
        format!(
            "
                INSERT INTO station
                (
                    created_at,
                    updated_at,
                    name,
                    stream_url,
                    votes,
                    favicon,
                    homepage,
                    tags,
                    country,
                    languages,
                    state
                )
                VALUES
                (
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    '{}',
                    '{}',
                    {},
                    '{}',
                    '{}',
                    '{{{}}}',
                    '{}',
                    '{{{}}}',
                    '{}'
                );
            ",
            escape_sql(&self.name),
            &self.stream_url,
            &self.votes,
            &self.favicon,
            escape_sql(&self.homepage),
            &self.tags
                .iter()
                .map(|tag| escape_sql(&tag))
                .map(|tag| format!("\"{}\"", &tag))
                .collect::<Vec<String>>()
                .join(","),
            escape_sql(&self.country),
            &self.languages.join(","),
            escape_sql(&self.state),
        )
    }
}

fn escape_sql(text: &str) -> String {
    text.replace("'", "''")
        .replace("\"", "\\\"")
}

#[async_std::main]
async fn main() {
    let limit = 500;
    let offset = 3 * limit;
    let url = format!("https://de1.api.radio-browser.info/json/stations?limit={}&offset={}&hidebroken=true&order=name", limit, offset);
    let mut response = match surf::get(&url).await {
        Ok(response) => response,
        Err(err) => panic!("{}", &err.to_string()),
    };
    let adapters = match response.body_json::<Vec<StationAdapter>>().await {
        Ok(adapters) => adapters,
        Err(err) => panic!("{}", &err.to_string()),
    };
    let pool = match PgPool::connect("postgres://typable:De24Si98@192.168.2.3:9748/verbal?sslmode=disable").await {
        Ok(pool) => pool,
        Err(err) => panic!("{}", &err.to_string()),
    };
    let mut transaction = match pool.begin().await {
        Ok(transaction) => transaction,
        Err(err) => panic!("{}", &err.to_string()),
    };
    for adapter in &adapters {
        let station = adapter.clone().populate(Station::default());
        match sqlx::query(&station.into_insert())
            .execute(&mut *transaction)
            .await
            {
                Ok(_) => (),
                Err(err) => panic!("{}", &err.to_string()),
            }
    }
    match transaction.commit().await {
        Ok(_) => println!("DONE"),
        Err(err) => panic!("{}", &err.to_string()),
    }
}
