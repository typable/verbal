use crate::Response;

#[derive(Default)]
pub struct Error;

#[tide::utils::async_trait]
impl<State: Clone + Send + Sync + 'static> tide::Middleware<State> for Error {
    async fn handle(&self, req: tide::Request<State>, next: tide::Next<'_, State>) -> tide::Result {
        let res = next.run(req).await;
        if let Some(err) = res.error() {
            error!("{}", err.to_string());
            return Response::throw(&err.to_string());
        }
        Ok(res)
    }
}
