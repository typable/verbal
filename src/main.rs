use verbal::abort;
use verbal::ok_or_abort;
use verbal::Server;

#[macro_use]
extern crate log;

#[tokio::main]
async fn main() {
    env_logger::init();
    let server = Server::default();
    ok_or_abort!(server.run().await, "fatal server error!");
}
