use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone, Serialize)]
pub struct Error {
    message: String,
}

impl Error {
    #[must_use]
    pub fn new(message: &str) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Self::new(&err.to_string())
    }
}

impl From<toml::de::Error> for Error {
    fn from(err: toml::de::Error) -> Self {
        Self::new(&err.to_string())
    }
}
