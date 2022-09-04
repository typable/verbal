/* ### station ### */

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
    score INTEGER
);

/* ### station status ### */

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

/* ### account ### */

CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    name TEXT,
    language TEXT DEFAULT 'en'
);

/* ### device ### */

CREATE TABLE device (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    name TEXT,
    account_id INTEGER
);

ALTER TABLE device
    ADD CONSTRAINT device_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

/* ### favorite ### */

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
