use sqlx::query_as;
use sqlx::Acquire;
use sqlx::PgConnection;
use sqlx::Result;

type Model = crate::models::Code;

pub const CODES_VERIFY: &str = "verify";

pub async fn insert(conn: &mut PgConnection, kind: &str, user_id: &i32) -> Result<Model> {
    query_as::<_, Model>(&format!(
        r#"
            INSERT INTO codes (kind, user_id)
            VALUES ('{kind}', '{user_id}')
            RETURNING codes.*
        "#,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}
