/* ############################################################ */
/* # station                                                  # */
/* ############################################################ */

CREATE TABLE station (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    homepage TEXT,
    tags TEXT[],
    country TEXT,
    state TEXT,
    languages TEXT[],
    score INTEGER,
    description TEXT,
    color TEXT,
    group_id INTEGER
);

ALTER TABLE station
    ADD CONSTRAINT station_group_id
    FOREIGN KEY (group_id)
    REFERENCES station_group(id);

/* ############################################################ */
/* # station_group                                            # */
/* ############################################################ */

CREATE TABLE station_group (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

/* ############################################################ */
/* # station_status                                           # */
/* ############################################################ */

CREATE TABLE station_status (
    id SERIAL PRIMARY KEY,
    station_id INTEGER UNIQUE,
    is_restricted BOOLEAN DEFAULT false,
    is_broken BOOLEAN DEFAULT false,
    is_no_track_info BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_icon BOOLEAN DEFAULT false
);

ALTER TABLE station_status
    ADD CONSTRAINT station_status_station_id
    FOREIGN KEY (station_id)
    REFERENCES station(id);

/* ############################################################ */
/* # station_stats                                            # */
/* ############################################################ */

CREATE TABLE station_stats (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    station_id INTEGER,
    playtime INTEGER DEFAULT 0,
    latest_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE station_stats
    ADD CONSTRAINT station_stats_unique
    UNIQUE(account_id, station_id);

ALTER TABLE station_stats
    ADD CONSTRAINT station_stats_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

ALTER TABLE station_stats
    ADD CONSTRAINT station_stats_station_id
    FOREIGN KEY (station_id)
    REFERENCES station(id);

/* ############################################################ */
/* # account                                                  # */
/* ############################################################ */

CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    name TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

/* ############################################################ */
/* # device                                                   # */
/* ############################################################ */

CREATE TABLE device (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    name TEXT,
    account_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE device
    ADD CONSTRAINT device_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

/* ############################################################ */
/* # favorite                                                 # */
/* ############################################################ */

CREATE TABLE favorite (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    station_id INTEGER
);

ALTER TABLE favorite
    ADD CONSTRAINT favorite_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

ALTER TABLE favorite
    ADD CONSTRAINT favorite_station_id
    FOREIGN KEY (station_id)
    REFERENCES station(id);
