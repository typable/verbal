use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_rustls::TlsListener;
use tide_sqlx::SQLxMiddleware;

use crate::middleware::*;
use crate::prelude::*;

use crate::routes;
use crate::ToAddress;
use crate::ToUrl;

#[derive(Default)]
pub struct Server;

#[derive(Debug, Clone)]
pub struct State {
    pub config: Config,
}

impl Server {
    pub async fn run(&self) -> Result<()> {
        let config = Config::acquire()?;
        let state = State {
            config: config.clone(),
        };
        let mut app = tide::with_state(state);

        /* bind middleware */
        app.with(ErrorMiddleware::default());
        app.with(ok_or_abort!(
            SQLxMiddleware::<Postgres>::new(&ok_or_abort!(
                config.database.to_url(),
                "cannot parse database address!"
            ))
            .await,
            "cannot connect to database!"
        ));
        app.with(AuthMiddleware::default());
        app.with(CorsMiddleware::new(&config.server.options.cors));
        app.with(CacheMiddleware::new(&config.server.options.caching));
        app.with(CompressMiddleware::new());

        /* serve content */
        let index_path = config.resolve_path("/www/index.html");
        app.at("/")
            .serve_file(&index_path)
            .expect("unable to bind index file!");
        app.at("/*")
            .serve_file(&index_path)
            .expect("unable to bind index file!");
        app.at("/worker.js")
            .serve_file(config.resolve_path("/dist/worker.js"))
            .expect("unable to bind worker file!");
        app.at("/assets")
            .serve_dir(config.resolve_path("/dist"))
            .expect("unable to bind assets directory!");

        /* handle prefetch */
        app.at("*").options(routes::do_prefetch);

        /* handle api requests */
        app.at("/api/register").post(routes::do_register);
        app.at("/api/login").post(routes::do_login);
        app.at("/api/logout").post(routes::do_logout);
        app.at("/api/verify").post(routes::do_verify);

        app.at("/api/user").get(routes::get_user);
        app.at("/api/user/:name").get(routes::get_user_by_name);

        let address = ok_or_abort!(config.server.to_address(), "cannot parse server address!");
        let url = ok_or_abort!(config.server.to_url(), "cannot parse server address!");
        info!("starting server on {}", url);
        let listener = if config.server.is_tls() {
            app.listen(
                TlsListener::build()
                    .addrs(&address)
                    .cert(some_or_abort!(
                        config.server.cert_path,
                        "no certificate for TLS found!"
                    ))
                    .key(some_or_abort!(
                        config.server.key_path,
                        "no key for TLS found!"
                    )),
            )
            .await
        } else {
            app.listen(address).await
        };
        ok_or_abort!(listener, "cannot start server!");
        Ok(())
    }
}
