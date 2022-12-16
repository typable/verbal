use sqlx::query_as;
use sqlx::Acquire;
use sqlx::PgConnection;
use sqlx::Result;

pub type Model = crate::models::Code;

pub async fn insert_session(conn: &mut PgConnection, user_id: &i32) -> Result<Model> {
    query_as::<_, Model>(&format!(
        r#"
            INSERT INTO codes (code_type, user_id)
            VALUES ('session', '{user_id}')
            ON CONFLICT (code_type, user_id) DO UPDATE
            SET code = uuid_generate_v4()
            RETURNING codes.*
        "#,
        user_id = user_id,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}

pub async fn insert_verify(conn: &mut PgConnection, user_id: &i32) -> Result<Model> {
    query_as::<_, Model>(&format!(
        r#"
                INSERT INTO codes (code_type, user_id)
                VALUES ('verify', '{user_id}')
                RETURNING codes.*
            "#,
        user_id = user_id,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}
