use sqlx::query;
use sqlx::query_as;
use sqlx::Acquire;
use sqlx::PgConnection;
use sqlx::Result;

use crate::queries::code::CODES_VERIFY;

type Model = crate::models::User;

pub async fn insert(
    conn: &mut PgConnection,
    name: &str,
    email: &str,
    password: &str,
) -> Result<Model> {
    query_as::<_, Model>(&format!(
        r#"
            INSERT INTO users (name, email, password)
            VALUES ('{name}', '{email}', '{password}')
            RETURNING users.*
        "#,
        name = name,
        email = email,
        password = password,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}

pub async fn update_verified(conn: &mut PgConnection, user_id: &i32, verified: bool) -> Result<()> {
    query(&format!(
        r#"
            UPDATE users
            SET verified = {verified}
            WHERE users.id = '{user_id}'
        "#,
        user_id = user_id,
        verified = verified,
    ))
    .execute(conn.acquire().await?)
    .await?;
    Ok(())
}

pub async fn get_by_name(conn: &mut PgConnection, name: &str) -> Result<Option<Model>> {
    query_as::<_, Model>(&format!(
        r#"
            SELECT users.* FROM users
            WHERE email = '{name}'
        "#,
        name = name,
    ))
    .fetch_optional(conn.acquire().await?)
    .await
}

pub async fn get_by_email_and_password(
    conn: &mut PgConnection,
    email: &str,
    password: &str,
) -> Result<Option<Model>> {
    query_as::<_, Model>(&format!(
        r#"
            SELECT users.* FROM users
            WHERE email = '{email}' AND password = '{password}'
        "#,
        email = email,
        password = password,
    ))
    .fetch_optional(conn.acquire().await?)
    .await
}

pub async fn get_by_session_token(conn: &mut PgConnection, token: &str) -> Result<Option<Model>> {
    query_as::<_, Model>(&format!(
        r#"
            SELECT users.* FROM users
            INNER JOIN sessions ON users.id = sessions.user_id
            WHERE sessions.token = '{token}'
        "#,
        token = token,
    ))
    .fetch_optional(conn.acquire().await?)
    .await
}

pub async fn get_by_verify_code(conn: &mut PgConnection, code: &str) -> Result<Option<Model>> {
    query_as::<_, Model>(&format!(
        r#"
            SELECT users.* FROM users
            INNER JOIN codes ON users.id = codes.user_id
            WHERE codes.kind = '{kind}'
            AND codes.code = '{code}'
        "#,
        kind = CODES_VERIFY,
        code = code,
    ))
    .fetch_optional(conn.acquire().await?)
    .await
}
