use regex::Regex;

pub fn to_array(value: String) -> Vec<String> {
    value
        .split(',')
        .map(str::to_string)
        .filter(|tag| !tag.trim().is_empty())
        .collect::<Vec<String>>()
}

pub fn upgrade_to_https(url: String) -> String {
    if Regex::new("^http://").unwrap().is_match(&url) {
        return format!("https://verbal.fm/api/upgrade?redirect={}", &url);
    }
    url
}
