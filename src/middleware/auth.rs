use sqlx::postgres::Postgres;
use sqlx::Acquire;
use tide::http::Method;
use tide_sqlx::SQLxRequestExt;

use crate::model;

#[derive(Default)]
pub struct AuthMiddleware;

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for AuthMiddleware {
    async fn handle(
        &self,
        mut req: tide::Request<State>,
        next: tide::Next<'_, State>,
    ) -> tide::Result {
        if req.method() != Method::Options && req.url().path().starts_with("/api") {
            let mut user = None;
            if let Some(cookie) = req.cookie("token") {
                let token = cookie.value();
                {
                    let sql = format!(
                        r#"
                            SELECT users.* FROM users
                            INNER JOIN sessions ON users.id = sessions.user_id
                            WHERE sessions.token = '{token}'
                        "#,
                        token = token,
                    );
                    let mut conn = req.sqlx_conn::<Postgres>().await;
                    match sqlx::query_as::<_, model::User>(&sql)
                        .fetch_one(conn.acquire().await?)
                        .await
                    {
                        Ok(model) => {
                            user = Some(model);
                        }
                        Err(err) => {
                            warn!("session for token '{}' does not exist! Err: {}", token, err);
                        }
                    }
                }
            }
            if let Some(user) = user {
                req.set_ext(user);
            }
        }
        let res = next.run(req).await;
        Ok(res)
    }
}
