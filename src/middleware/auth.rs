use sqlx::postgres::Postgres;
use sqlx::Acquire;
use tide_sqlx::SQLxRequestExt;

use crate::model;
use crate::response::Response;

#[derive(Default)]
pub struct Auth;

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for Auth {
    async fn handle(
        &self,
        mut req: tide::Request<State>,
        next: tide::Next<'_, State>,
    ) -> tide::Result {
        if req.url().path().starts_with("/api") {
            let token = match req.header("verbal-token") {
                Some(header) => header.as_str(),
                None => return Response::throw("No request header 'verbal-token' provided!"),
            };
            let query = format!(
                "
                    SELECT account.*
                        FROM account
                        INNER JOIN device
                        ON account.id = device.account_id
                        WHERE device.uid = '{}'
                ",
                &token,
            );
            let option_account;
            {
                let mut conn = req.sqlx_conn::<Postgres>().await;
                option_account = sqlx::query_as::<_, model::Account>(&query)
                    .fetch_optional(conn.acquire().await.unwrap())
                    .await
                    .unwrap();
            }
            match option_account {
                Some(account) => {
                    req.set_ext(account);
                }
                None => {
                    return Response::throw("No account found for provided header 'verbal-token'!");
                }
            }
        }
        let res = next.run(req).await;
        Ok(res)
    }
}
