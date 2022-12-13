use crate::config::Auth;
use crate::error::Error;
use crate::messages;
use crate::Result;

pub fn hash_password(password: &str, auth: &Auth) -> Result<String> {
    let hash = match bcrypt::hash_with_salt(password, auth.cost, auth.salt) {
        Ok(hash) => hash,
        Err(err) => {
            error!("unable to generate hash for password! Err: {}", err);
            return Err(Error::new(messages::INTERNAL_ERROR));
        }
    };
    Ok(hash.to_string())
}
