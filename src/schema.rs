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

table! {
    favorite (id) {
        id -> Integer,
        account_id -> Integer,
        station_id -> Integer,
    }
}

joinable!(device -> account (account_id));
joinable!(favorite -> account (account_id));
joinable!(favorite -> station (station_id));

allow_tables_to_appear_in_same_query!(account, device, favorite,);
