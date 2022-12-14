use sqlx::Acquire;
use sqlx::PgConnection;

use crate::model;

pub async fn get_user_by_session_token(
    conn: &mut PgConnection,
    token: &str,
) -> sqlx::Result<model::User> {
    sqlx::query_as::<_, model::User>(&format!(
        r#"
            SELECT users.* FROM users
            INNER JOIN sessions ON users.id = sessions.user_id
            WHERE sessions.token = '{token}'
        "#,
        token = token,
    ))
    .fetch_one(conn.acquire().await?)
    .await
}
