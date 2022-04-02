table! {
    account (id) {
        id -> Integer,
        username -> Nullable<Text>,
        language -> Text,
        is_playback_history -> Bool,
    }
}

table! {
    device (id) {
        id -> Integer,
        token -> Text,
        account_id -> Integer,
    }
}

table! {
    station (id) {
        id -> Integer,
        uuid -> Text,
        name -> Text,
        stream_url -> Text,
        votes -> Integer,
        favicon -> Nullable<Text>,
        homepage -> Nullable<Text>,
        tags -> Array<Text>,
        country -> Nullable<Text>,
        languages -> Array<Text>,
        state -> Nullable<Text>,
    }
}
