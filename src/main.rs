use verbal::abort;
use verbal::init_logger;
use verbal::Server;

#[tokio::main]
async fn main() {
    init_logger();
    let server = Server::default();
    server.run().await.unwrap_or_else(|err| abort(&err));
}
