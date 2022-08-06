use sqlx::postgres::Postgres;
use tide_compress::CompressMiddleware;
use tide_sqlx::SQLxMiddleware;

use crate::abort;
use crate::api::Search;
use crate::data;
use crate::middleware::Auth;
use crate::middleware::Cors;
use crate::model;
use crate::Config;
use crate::Response;
use crate::Result;
use crate::Service;

#[derive(Default)]
pub struct Server {}

impl Server {
    pub async fn run(&self) -> Result<()> {
        let config = Config::acquire().unwrap_or_else(|err| abort(&err));
        let mut app = tide::new();

        /* bind middleware */
        app.with(Auth::default());
        app.with(Cors::new(&config.server.options.origin));
        app.with(CompressMiddleware::new());
        app.with(
            SQLxMiddleware::<Postgres>::new(&config.database.to_string())
                .await
                .unwrap(),
        );

        /* handle prefetch */
        app.at("*")
            .options(|_: tide::Request<()>| async move { Ok(tide::Response::new(200)) });

        /* serve content */
        app.at("/").serve_file("www/index.html")?;
        app.at("/asset").serve_dir("www/asset/")?;
        app.at("/app").serve_dir("app/")?;

        app.at("/api/account").get(get_account);

        app.at("/api/search")
            .get(|req: tide::Request<()>| async move {
                let search = match req.query::<Search>() {
                    Ok(query) => query,
                    Err(err) => return Response::throw(&err.to_string()),
                };
                match Service::search(search, req).await {
                    Ok(data) => Response::with(data),
                    Err(err) => Response::throw(&err.to_string()),
                }
            });

        app.at("/api/song")
            .get(|req: tide::Request<()>| async move {
                let song = match req.query::<data::Song>() {
                    Ok(song) => song,
                    Err(err) => return Response::throw(&err.to_string()),
                };
                match Service::get_song(song).await {
                    Ok(data) => Response::with(data),
                    Err(err) => Response::throw(&err.to_string()),
                }
            });

        app.at("/api/like")
            .get(|req: tide::Request<()>| async move {
                match Service::get_likes(req).await {
                    Ok(data) => Response::with(data),
                    Err(err) => Response::throw(&err.to_string()),
                }
            });

        app.at("/api/like")
            .post(|req: tide::Request<()>| async move {
                match Service::add_like(req).await {
                    Ok(data) => Response::with(data),
                    Err(err) => Response::throw(&err.to_string()),
                }
            });

        app.at("/api/like")
            .delete(|req: tide::Request<()>| async move {
                match Service::remove_like(req).await {
                    Ok(data) => Response::with(data),
                    Err(err) => Response::throw(&err.to_string()),
                }
            });

        app.listen(&config.server.to_string()).await?;
        Ok(())
    }
}

async fn get_account(req: tide::Request<()>) -> tide::Result {
    let account = req.ext::<model::Account>().unwrap();
    let data: data::Account = (*account).clone().into();
    Response::with(data)
}
