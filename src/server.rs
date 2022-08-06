use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_sqlx::SQLxMiddleware;

use crate::abort;
use crate::middleware::Auth;
use crate::middleware::Cors;
use crate::middleware::Error;
use crate::route;
use crate::Config;
use crate::Result;

#[derive(Default)]
pub struct Server;

impl Server {
    pub async fn run(&self) -> Result<()> {
        let config = Config::acquire().unwrap_or_else(|err| abort(&err));
        let mut app = tide::new();

        /* bind middleware */
        app.with(Error::default());
        app.with(
            SQLxMiddleware::<Postgres>::new(&config.database.to_string())
                .await
                .unwrap(),
        );
        app.with(Auth::default());
        app.with(Cors::new(&config.server.options.origin));
        app.with(CompressMiddleware::new());

        /* serve content */
        app.at("/").serve_file("www/index.html")?;
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

        app.listen(&config.server.to_string()).await?;
        Ok(())
    }
}
