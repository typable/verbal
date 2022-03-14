use serde::{Deserialize, Serialize};
use sqlx::FromRow;

pub trait Query {
    fn into_keys(&self) -> String;
    fn into_values(&self) -> String;
    fn into_update(&self) -> String;
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct Model<T> {
    pub id: i32,
    pub inner: T,
}

impl<T> Model<T> where T: Query {
    pub fn new(inner: T) -> Self {
        Self { id: 0, inner }
    }
    pub fn from(id: i32, inner: T) -> Self {
        Self { id, inner }
    }
    pub fn into_insert(&self, table: &str) -> String {
        format!(
            "
                INSERT INTO {}
                (
                    {}
                    created_at,
                    updated_at
                )
                VALUES
                (
                    {}
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            ",
            &table,
            &self.inner.into_keys(),
            &self.inner.into_values(),
        )
    }
    pub fn into_update(&self, table: &str) -> String {
        format!(
            "
                UPDATE {}
                SET
                    {}
                    updated_at = CURRENT_TIMESTAMP
                WHERE
                    id = {}
            ",
            &table,
            &self.inner.into_update(),
            &self.id,
        )
    }
}
