use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_rustls::TlsListener;
use tide_sqlx::SQLxMiddleware;

use crate::abort;
use crate::middleware::Auth;
use crate::middleware::Cors;
use crate::middleware::Error;
use crate::route;
use crate::unwrap_option_or_abort;
use crate::unwrap_result_or_abort;
use crate::Config;
use crate::Result;
use crate::ToUrl;

#[derive(Default)]
pub struct Server;

impl Server {
    pub async fn run(&self) -> Result<()> {
        let config = unwrap_result_or_abort!(Config::acquire(), "cannot acquire config!");
        let mut app = tide::new();

        /* bind middleware */
        app.with(Error::default());
        app.with(unwrap_result_or_abort!(
            SQLxMiddleware::<Postgres>::new(&unwrap_result_or_abort!(
                config.database.to_url(),
                "cannot parse database address!"
            ))
            .await,
            "cannot connect to database!"
        ));
        app.with(Auth::default());
        app.with(Cors::new(&config.server.options.origin));
        app.with(CompressMiddleware::new());

        /* serve content */
        app.at("/").serve_file("www/index.html")?;
        app.at("/manifest.json").serve_file("www/manifest.json")?;
        app.at("/worker.js").serve_file("www/worker.js")?;
        app.at("/asset").serve_dir("www/asset/")?;
        app.at("/app").serve_dir("app/")?;

        /* handle prefetch */
        app.at("*").options(route::do_prefetch);

        /* handle api requests */
        app.at("/api/account").get(route::get_account);
        app.at("/api/search").get(route::do_search);
        app.at("/api/song").get(route::get_song);
        app.at("/api/favorite").get(route::get_favorites);
        app.at("/api/favorite").post(route::add_favorite);
        app.at("/api/favorite").delete(route::delete_favorite);

        let address =
            unwrap_result_or_abort!(config.server.to_url(), "cannot parse server address!");
        info!("starting server on {}", address);
        let listener = if config.server.is_tls() {
            app.listen(
                TlsListener::build()
                    .addrs(&address)
                    .cert(unwrap_option_or_abort!(
                        config.server.cert_path,
                        "no certificate for TLS found!"
                    ))
                    .key(unwrap_option_or_abort!(
                        config.server.key_path,
                        "no key for TLS found!"
                    )),
            )
            .await
        } else {
            app.listen(address).await
        };
        unwrap_result_or_abort!(listener, "cannot start server!");
        Ok(())
    }
}
