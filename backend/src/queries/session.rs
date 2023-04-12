use sqlx::query_as;
use sqlx::Acquire;
use sqlx::PgConnection;
use sqlx::Result;

type Model = crate::models::Session;

pub async fn insert(conn: &mut PgConnection, user_id: &i32) -> Result<Model> {
    query_as::<_, Model>(&format!(
        r#"
            INSERT INTO sessions (user_id)
            VALUES ('{user_id}')
            RETURNING sessions.*
        "#,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}
