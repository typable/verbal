use sqlx::prelude::*;
use sqlx::postgres::Postgres;
use tide_sqlx::SQLxMiddleware;
use tide_sqlx::SQLxRequestExt;
use regex::Regex;
use async_std::io::ReadExt;
use tide_compress::CompressMiddleware;

use verbal::Config;
use verbal::model::Model;
use verbal::adapter::Adapter;
use verbal::middleware::CorsMiddleware;
use verbal::{State, Response, Error, ErrorKind};

mod models;
use models::{Account, Favorite, Search, Code, Station, StationAdapter};

#[async_std::main]
async fn main() -> tide::Result<()> {

    let config = Config::from_file("./config.ron")
        .expect("Unable to parse config!");

    let mut app = tide::with_state(State::new(config.clone()));

    /* bind database middleware */
    app.with(SQLxMiddleware::<Postgres>::new(&config.database.to_string()).await?);

    /* bind cors middleware */
    app.with(CorsMiddleware::new(&config.options.origin));

    /* bind compression middleware */
    app.with(CompressMiddleware::new());

    /* handle prefetch */
    app.at("*").options(|_: tide::Request<State>| async move {
        Ok(tide::Response::new(200))
    });

    /* provide index */
    app.at("/").serve_file("www/index.html")?;

    /* provide assets */
    app.at("/asset").serve_dir("www/asset/")?;

    /* provide app */
    app.at("/app").serve_dir("app/")?;

    /* get account */
    app.at("/api/account").get(|req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        Response::with(&account.inner)
    });

    /* create account */
    app.at("/api/account").post(|req: tide::Request<State>| async move {
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let account = Model::new(Account::default());
        match sqlx::query(&account.into_insert("account"))
            .execute(conn.acquire().await.unwrap())
            .await
            {
                Ok(_) => Response::success(),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* update account */
    app.at("/api/account").put(|mut req: tide::Request<State>| async move {
        let mut account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let inner = match req.body_json::<Account>().await {
            Ok(inner) => inner,
            Err(err) => return Response::throw(Error::new(ErrorKind::Arguments, &err.to_string())),
        };
        account.inner = inner;
        let mut conn = req.sqlx_conn::<Postgres>().await;
        match sqlx::query(&account.into_update("account"))
            .execute(conn.acquire().await.unwrap())
            .await
            {
                Ok(_) => Response::success(),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* get favorite */
    app.at("/api/favorite").get(|req: tide::Request<State>| async move {
        let state = req.state();
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let query = format!(
            "
                SELECT station_id FROM favorite
                WHERE account_id = {}
                ORDER BY created_at DESC
            ",
            &account.id,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let station_ids = match sqlx::query(&query)
            .fetch_all(conn.acquire().await.unwrap())
            .await
            {
                Ok(rows) => rows.iter().map(|row| row.get("station_id")).collect::<Vec<String>>(),
                Err(err) => return Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            };
        let url = format!(
            "{}/json/stations/byuuid?uuids={}",
            &state.config.options.api_url,
            &station_ids.join(","),
        );
        let mut response = match surf::get(&url).await {
            Ok(response) => response,
            Err(err) => return Response::throw(Error::new(ErrorKind::Fetch, &err.to_string())),
        };
        let adapters = match response.body_json::<Vec<StationAdapter>>().await {
            Ok(adapters) => adapters,
            Err(err) => return Response::throw(Error::new(ErrorKind::Parse, &err.to_string())),
        };
        let mut stations = vec![];
        for station_id in station_ids {
            for adapter in &adapters {
                if adapter.stationuuid == station_id {
                    let mut station = Station::default();
                    station.is_favorite = true;
                    stations.push(adapter.clone().populate(station));
                }
            }
        }
        Response::with(&stations)
    });

    /* create favorite */
    app.at("/api/favorite").post(|mut req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let id = match req.body_json::<String>().await {
            Ok(inner) => inner,
            Err(err) => return Response::throw(Error::new(ErrorKind::Arguments, &err.to_string())),
        };
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let favorite = Model::new(Favorite::new(&id, account.id));
        match sqlx::query(&favorite.into_insert("favorite"))
            .execute(conn.acquire().await.unwrap())
            .await
            {
                Ok(_) => Response::success(),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* delete favorite */
    app.at("/api/favorite").delete(|mut req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let id = match req.body_json::<String>().await {
            Ok(inner) => inner,
            Err(err) => return Response::throw(Error::new(ErrorKind::Arguments, &err.to_string())),
        };
        let mut conn = req.sqlx_conn::<Postgres>().await;
        match sqlx::query(&format!(
            "
                DELETE FROM favorite
                WHERE account_id = {}
                AND station_id = '{}'
            ",
            &account.id,
            &id,
        ))
            .execute(conn.acquire().await.unwrap())
            .await
            {
                Ok(_) => Response::success(),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* search */
    app.at("/api/search").get(|req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let inner = match req.query::<Search>() {
            Ok(inner) => inner,
            Err(err) => return Response::throw(Error::new(ErrorKind::Arguments, &err.to_string())),
        };
        let state = req.state();
        let url = format!(
            "{}/json/stations/search?{}",
            &state.config.options.api_url,
            &inner.into_query(),
        );
        let mut response = match surf::get(&url).await {
            Ok(response) => response,
            Err(err) => return Response::throw(Error::new(ErrorKind::Fetch, &err.to_string())),
        };
        let adapters = match response.body_json::<Vec<StationAdapter>>().await {
            Ok(adapters) => adapters,
            Err(err) => return Response::throw(Error::new(ErrorKind::Parse, &err.to_string())),
        };
        let query = format!(
            "
                SELECT station_id
                FROM favorite
                WHERE account_id = {}
            ",
            &account.id,
        );
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let station_ids = match sqlx::query(&query)
            .fetch_all(conn.acquire().await.unwrap())
            .await
            {
                Ok(rows) => rows.iter().map(|row| row.get("station_id")).collect::<Vec<String>>(),
                Err(err) => return Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            };
        let mut stations = vec![];
        for adapter in &adapters {
            let mut station = Station::default();
            station.is_favorite = station_ids.contains(&adapter.stationuuid);
            stations.push(adapter.clone().populate(station));
        }
        Response::with(&stations)
    });

    /* song */
    app.at("/api/song").get(|mut req: tide::Request<State>| async move {
        let _ = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let inner = match req.body_json::<String>().await {
            Ok(inner) => inner,
            Err(err) => return Response::throw(Error::new(ErrorKind::Arguments, &err.to_string())),
        };
        let mut response = match surf::get(&inner)
            .header("icy-metadata", "1")
            .await {
                Ok(response) => response,
                Err(err) => return Response::throw(Error::new(ErrorKind::Fetch, &err.to_string())),
            };
        let meta_int = match response.header("icy-metaint") {
            Some(header) => header.as_str(),
            None => return Response::throw(Error::new(ErrorKind::Arguments, "No request header 'icy-metaint' found!")),
        };
        let interval = match meta_int.parse::<usize>() {
            Ok(value) => value * 2,
            Err(err) => return Response::throw(Error::new(ErrorKind::Parse, &err.to_string())),
        };
        let mut count = 0;
        let mut bytes = vec![];
        let mut buf = [0; 10000];
        let mut title = None;
        loop {
            let len = response.read(&mut buf).await.unwrap();
            bytes.extend_from_slice(&buf);
            if count + len > interval {
                let metadata = String::from_utf8_lossy(&bytes);
                for cap in Regex::new("StreamTitle='([^;]*)';").unwrap()
                    .captures_iter(&metadata)
                    {
                        title = Some(cap[1].to_string());
                        break;
                    }
                break;
            }
            count += len;
        }
        Response::with_option(title)
    });

    /* get code */
    app.at("/api/code").get(|req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let mut conn = req.sqlx_conn::<Postgres>().await;
        match sqlx::query_as::<_, Code>(
            &format!(
                "
                    SELECT *, timestamp <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '1 minutes' as expired
                    FROM code
                    WHERE account_id = {}
                ",
                &account.id,
            )
        )
            .fetch_one(conn.acquire().await.unwrap())
            .await
            {
                Ok(code) => Response::with(code),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* create code */
    app.at("/api/code").post(|req: tide::Request<State>| async move {
        let account = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        let mut conn = req.sqlx_conn::<Postgres>().await;
        let code = Code::new();
        match sqlx::query(
            &format!(
                "
                    INSERT INTO code
                        (code, account_id, timestamp, used)
                    VALUES
                        ('{}', '{}', CURRENT_TIMESTAMP, false)
                    ON CONFLICT
                        (account_id)
                    DO UPDATE
                    SET
                        code = excluded.code,
                        timestamp = excluded.timestamp,
                        used = excluded.used
                ",
                &code.code,
                &account.id,
            )
        )
            .execute(conn.acquire().await.unwrap())
            .await
            {
                Ok(_) => Response::with(code),
                Err(err) => Response::throw(Error::new(ErrorKind::Query, &err.to_string())),
            }
    });

    /* update code */
    app.at("/api/code").put(|req: tide::Request<State>| async move {
        let _ = match identify(&req).await {
            Ok(model) => model,
            Err(err) => return Response::throw(err),
        };
        Response::success()
    });

    app.listen(&config.server.to_string()).await?;

    Ok(())

}

async fn identify(req: &tide::Request<State>) -> Result<Model<Account>, Error> {
    let token = match req.header("verbal-token") {
        Some(header) => header.as_str(),
        None => return Err(Error::new(ErrorKind::Identity, "No request header 'verbal-token' provided!")),
    };
    let query = format!(
        "
            SELECT account.* FROM account
            INNER JOIN device
            ON device.account_id = account.id
            WHERE device.token = '{}'
        ",
        &token,
    );
    let mut conn = req.sqlx_conn::<Postgres>().await;
    let id = match sqlx::query(&query)
        .fetch_one(conn.acquire().await.unwrap())
        .await
        {
            Ok(row) => row.get("id"),
            Err(_) => return Err(Error::new(ErrorKind::Identity, "No account found for provided header 'verbal-token'!")),
        };
    let inner = match sqlx::query_as::<_, Account>(&query)
        .fetch_one(conn.acquire().await.unwrap())
        .await
        {
            Ok(inner) => inner,
            Err(_) => return Err(Error::new(ErrorKind::Identity, "No account found for provided header 'verbal-token'!")),
        };
    Ok(Model::from(id, inner))
}
