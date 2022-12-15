use sqlx::postgres::Postgres;
use tide::http::Method;
use tide_sqlx::SQLxRequestExt;

use crate::queries;

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
            if let Some(cookie) = req.cookie("token") {
                let token = cookie.value();
                let user;
                {
                    let mut conn = req.sqlx_conn::<Postgres>().await;
                    user = queries::get_user_by_session_token(&mut conn, token)
                        .await
                        .map_err(|err| {
                            debug!("session for token '{}' does not exist! Err: {}", token, err);
                        })
                        .ok();
                }
                if let Some(user) = user {
                    req.set_ext(user);
                }
            }
        }
        let res = next.run(req).await;
        Ok(res)
    }
}
