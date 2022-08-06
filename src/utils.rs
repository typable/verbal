pub fn to_array(value: &str) -> Vec<String> {
    value
        .split(',')
        .map(str::to_string)
        .filter(|tag| !tag.trim().is_empty())
        .collect::<Vec<String>>()
}

pub fn upgrade_to_https(url: &str) -> String {
    if url.starts_with("http://") {
        return format!("https://verbal.fm/api/upgrade?redirect={}", &url);
    }
    url.to_string()
}
