use verbal::abort;
use verbal::init_logger;
use verbal::ok_or_abort;
use verbal::Server;

#[macro_use]
extern crate log;

#[tokio::main]
async fn main() {
    init_logger();
    let server = Server::default();
    ok_or_abort!(server.run().await, "fatal server error!");
}
