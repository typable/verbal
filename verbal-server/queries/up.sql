/* ############################################################ */
/* # users                                                    # */
/* ############################################################ */

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

/* ############################################################ */
/* # codes                                                    # */
/* ############################################################ */

CREATE TABLE codes (
    id SERIAL PRIMARY KEY,
    code_type TEXT NOT NULL,
    code TEXT DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE codes
    ADD CONSTRAINT codes_users_id
    FOREIGN KEY (user_id)
    REFERENCES users(id);

ALTER TABLE codes
    ADD CONSTRAINT codes_unique
    UNIQUE (code_type, user_id);
