/* ########## account ########## */
CREATE TABLE account (
    id serial PRIMARY KEY,
    created_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    username text,
    language character(2) DEFAULT 'en',
    is_playback_history boolean DEFAULT true
);

/* ########## device ########## */
CREATE TABLE device (
    id serial PRIMARY KEY,
    created_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    token text UNIQUE NOT NULL,
    account_id integer
);

ALTER TABLE device
    ADD CONSTRAINT device_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

/* ########## station ########## */
CREATE TABLE station (
    id serial PRIMARY KEY,
    uuid TEXT UNIQUE,
    created_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    "name" text NOT NULL,
    stream_url text NOT NULL,
    votes integer DEFAULT 0,
    favicon text,
    homepage text,
    tags text[],
    country text,
    languages text[],
    "state" text
);

/* ########## like ########## */
CREATE TABLE "like" (
    id serial PRIMARY KEY,
    created_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp without time zone NOT NULL DEFAULT current_timestamp,
    station_id text NOT NULL,
    account_id integer NOT NULL
);

ALTER TABLE "like"
    ADD CONSTRAINT like_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);

/* ########## code ########## */
CREATE TABLE code (
    id serial PRIMARY KEY,
    code text UNIQUE NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    account_id integer UNIQUE NOT NULL
);

ALTER TABLE code
    ADD CONSTRAINT code_account_id
    FOREIGN KEY (account_id)
    REFERENCES account(id);
