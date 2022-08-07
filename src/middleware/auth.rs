use sqlx::postgres::Postgres;
use sqlx::Acquire;
use tide_sqlx::SQLxRequestExt;

use crate::model;
use crate::unwrap_option_or_throw;
use crate::unwrap_result_or_throw;

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
            let token =
                unwrap_option_or_throw!(req.header("verbal-token"), "no token was provided!")
                    .as_str();
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
                option_account = unwrap_result_or_throw!(
                    sqlx::query_as::<_, model::Account>(&query)
                        .fetch_optional(unwrap_result_or_throw!(
                            conn.acquire().await,
                            "cannot acquire connection to database!"
                        ))
                        .await,
                    "cannot acquire account for given device!"
                );
            }
            req.set_ext(unwrap_option_or_throw!(
                option_account,
                "no account found for given token!"
            ));
        }
        let res = next.run(req).await;
        Ok(res)
    }
}
