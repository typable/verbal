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
        let config = unwrap_result_or_abort!(Config::acquire(), "cannot acquire config!");
        let state = State {
            config: config.clone(),
        };
        let mut app = tide::with_state(state);

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
        app.at("/").serve_file("index.html")?;
        app.at("/*").serve_file("index.html")?;
        app.at("/dist").serve_dir("dist/")?;

        /* handle prefetch */
        app.at("*").options(route::do_prefetch);

        /* handle api requests */
        app.at("/api/register").post(route::do_register);
        app.at("/api/login").post(route::do_login);
        app.at("/api/verify").post(route::do_verify);

        app.at("/api/user").get(route::get_user);

        app.at("/api/account").get(route::get_account);
        app.at("/api/account").put(route::update_account);
        app.at("/api/account").post(route::add_account);
        app.at("/api/search").get(route::do_search);
        app.at("/api/song").get(route::get_song);
        app.at("/api/favorite").get(route::get_favorites);
        app.at("/api/favorite").post(route::add_favorite);
        app.at("/api/favorite").delete(route::delete_favorite);
        app.at("/api/account/:id").get(route::get_account_by_id);
        app.at("/api/station/:id").get(route::get_station_by_id);
        app.at("/api/category/:kind").get(route::get_category);
        app.at("/api/group/:id").get(route::get_group);
        app.at("/api/countries").get(route::get_countries);
        app.at("/api/languages").get(route::get_languages);
        app.at("/api/tags").get(route::get_tags);
        app.at("/api/devices").get(route::get_devices);

        let address =
            unwrap_result_or_abort!(config.server.to_address(), "cannot parse server address!");
        let url = unwrap_result_or_abort!(config.server.to_url(), "cannot parse server address!");
        info!("starting server on {}", url);
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
