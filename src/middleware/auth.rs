use diesel::prelude::*;
use tide_diesel::DieselRequestExt;

use crate::error::ErrorKind;
use crate::models::*;
use crate::response::Response;
use crate::schema::account;
use crate::schema::device;

pub struct AuthMiddleware {}

impl AuthMiddleware {
    pub fn new() -> Self {
        Self {}
    }
}

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for AuthMiddleware {
    async fn handle(
        &self,
        mut req: tide::Request<State>,
        next: tide::Next<'_, State>,
    ) -> tide::Result {
        if req.url().path().starts_with("/api") {
            let token = match req.header("verbal-token") {
                Some(header) => header.as_str(),
                None => {
                    return Response::throw(
                        ErrorKind::Identity,
                        "No request header 'verbal-token' provided!",
                    )
                }
            };
            let conn = req.pg_conn().await?;
            let identity: Option<(Account, Device)> = account::table
                .inner_join(device::table)
                .filter(device::dsl::token.eq(token))
                .first(&conn)
                .optional()?;
            if identity.is_none() {
                return Response::throw(
                    ErrorKind::Identity,
                    "No account found for provided header 'verbal-token'!",
                );
            }
            req.set_ext(identity.unwrap());
        }
        let res = next.run(req).await;
        Ok(res)
    }
}
