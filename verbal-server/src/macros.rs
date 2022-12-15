#[macro_export]
macro_rules! abort {
    ($message:expr) => {{
        error!("{}", $message);
        std::process::exit(1)
    }};
    ($message:expr, $err:expr) => {{
        error!("{} Err: {}", $message, $err);
        std::process::exit(1)
    }};
}

#[macro_export]
macro_rules! ok_or_abort {
    ($target:expr, $message:expr) => {{
        $target.unwrap_or_else(|err| abort!($message, &err))
    }};
}

#[macro_export]
macro_rules! some_or_abort {
    ($target:expr, $message:expr) => {{
        $target.unwrap_or_else(|| abort!($message))
    }};
}

#[macro_export]
macro_rules! ok_or_throw {
    ($target:expr, $message:expr) => {{
        match $target {
            Ok(target) => target,
            Err(err) => {
                error!("{}\n{}", $message, err);
                return Ok($crate::body::Body::throw($message));
            }
        }
    }};
}

#[macro_export]
macro_rules! some_or_throw {
    ($target:expr, $message:expr) => {{
        match $target {
            Some(target) => target,
            None => {
                error!("{}", $message);
                return Ok($crate::body::Body::throw($message));
            }
        }
    }};
}
