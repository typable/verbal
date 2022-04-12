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
