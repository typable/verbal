use std::collections::HashMap;
use std::fs;

use lettre::message::MultiPart;
use lettre::transport::smtp::authentication::Credentials;
use lettre::Message;
use lettre::SmtpTransport;
use lettre::Transport;

use crate::config::Auth;
use crate::config::Mail;
use crate::error::Error;
use crate::messages;
use crate::Result;

pub fn hash_password(password: &str, config: &Auth) -> Result<String> {
    let hash = match bcrypt::hash_with_salt(password, config.cost, config.salt) {
        Ok(hash) => hash,
        Err(err) => {
            error!("unable to generate hash for password! Err: {}", err);
            return Err(Error::new(messages::INTERNAL_ERROR));
        }
    };
    Ok(hash.to_string())
}

pub fn create_multipart(filename: &str, content: HashMap<&str, &str>) -> Result<MultiPart> {
    let mut plain = fs::read_to_string(format!("emails/{}.txt", filename))?;
    let mut html = fs::read_to_string(format!("emails/{}.html", filename))?;
    for (key, value) in content.iter() {
        let exp = format!("{{{}}}", key);
        plain = plain.replace(&exp, value);
        html = html.replace(&exp, value);
    }
    let multipart = MultiPart::alternative_plain_html(plain, html);
    Ok(multipart)
}

pub fn send_email(recipient: &str, multipart: MultiPart, config: &Mail) -> Result<()> {
    let sender = format!("verbal.fm <{}>", config.email);
    let email = Message::builder()
        .from(sender.parse().unwrap())
        .to(recipient.parse().unwrap())
        .subject("Verify your account")
        .multipart(multipart)
        .unwrap();
    let credentials = Credentials::new(config.username.clone(), config.password.clone());
    let mailer = SmtpTransport::relay(&config.provider)
        .unwrap()
        .credentials(credentials)
        .build();
    if let Err(err) = mailer.send(&email) {
        return Err(Error::new(&format!(
            "failed to send email to '{}'! Err: {}",
            recipient, err
        )));
    }
    Ok(())
}
