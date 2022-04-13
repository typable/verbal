use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_sqlx::SQLxMiddleware;

mod api;
mod config;
mod data;
mod error;
mod middleware;
mod model;
mod response;
mod rest;
mod service;
mod utils;

use api::Search;
use config::Config;
use error::ErrorKind;
use middleware::{AuthMiddleware, CorsMiddleware};
use response::Response;
use service::Service;

#[async_std::main]
async fn main() -> tide::Result<()> {
    let config = Config::from_file("./config.ron").expect("Unable to parse config!");

    let mut app = tide::new();

    /* bind database middleware */
    app.with(
        SQLxMiddleware::<Postgres>::new(&config.database.to_string())
            .await
            .unwrap(),
    );

    /* bind cors middleware */
    app.with(CorsMiddleware::new(&config.options.origin));

    /* bind auth middleware */
    app.with(AuthMiddleware::new());

    /* bind compression middleware */
    app.with(CompressMiddleware::new());

    /* handle prefetch */
    app.at("*")
        .options(|_: tide::Request<()>| async move { Ok(tide::Response::new(200)) });

    /* provide index */
    app.at("/").serve_file("www/index.html")?;

    /* provide assets */
    app.at("/asset").serve_dir("www/asset/")?;

    /* provide app */
    app.at("/app").serve_dir("app/")?;

    app.at("/api/search")
        .get(|req: tide::Request<()>| async move {
            let search = match req.query::<Search>() {
                Ok(query) => query,
                Err(err) => return Response::throw(ErrorKind::Arguments, &err.to_string()),
            };
            match Service::search(search, req).await {
                Ok(data) => Response::with(data),
                Err(err) => Response::throw(ErrorKind::Fetch, &err.to_string()),
            }
        });

    app.at("/api/like")
        .get(|req: tide::Request<()>| async move {
            match Service::get_likes(req).await {
                Ok(data) => Response::with(data),
                Err(err) => Response::throw(ErrorKind::Fetch, &err.to_string()),
            }
        });

    app.at("/api/like")
        .post(|req: tide::Request<()>| async move {
            match Service::add_like(req).await {
                Ok(data) => Response::with(data),
                Err(err) => Response::throw(ErrorKind::Fetch, &err.to_string()),
            }
        });

    app.at("/api/like")
        .delete(|req: tide::Request<()>| async move {
            match Service::remove_like(req).await {
                Ok(data) => Response::with(data),
                Err(err) => Response::throw(ErrorKind::Fetch, &err.to_string()),
            }
        });

    app.listen(&config.server.to_string()).await?;

    Ok(())
}
