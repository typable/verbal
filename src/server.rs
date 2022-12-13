use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_rustls::TlsListener;
use tide_sqlx::SQLxMiddleware;

use crate::abort;
use crate::middleware::AuthMiddleware;
use crate::middleware::CacheMiddleware;
use crate::middleware::CorsMiddleware;
use crate::middleware::ErrorMiddleware;
use crate::ok_or_abort;
use crate::route;
use crate::some_or_abort;
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
        app.at("/")
            .serve_file("www/index.html")
            .expect("unable to bind '/'!");
        app.at("/*")
            .serve_file("www/index.html")
            .expect("unable to bind '/*'!");
        app.at("/assets")
            .serve_dir("dist/")
            .expect("unable to bind '/assets'!");

        /* handle prefetch */
        app.at("*").options(route::do_prefetch);

        /* handle api requests */
        app.at("/api/register").post(route::do_register);
        app.at("/api/login").post(route::do_login);
        app.at("/api/logout").post(route::do_logout);
        app.at("/api/verify").post(route::do_verify);

        app.at("/api/user").get(route::get_user);
        app.at("/api/user/:name").get(route::get_user_by_name);

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
