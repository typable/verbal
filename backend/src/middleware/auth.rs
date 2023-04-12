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
                let mut user = None;
                {
                    let mut conn = req.sqlx_conn::<Postgres>().await;
                    match queries::user::get_by_session_token(&mut conn, token).await {
                        Ok(model) => {
                            if model.is_none() {
                                debug!("session for token '{}' does not exist!", token);
                            }
                            user = model;
                        }
                        Err(err) => {
                            error!(
                                "unable to get user for session code '{}'! Err: {}",
                                token, err
                            );
                        }
                    }
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
