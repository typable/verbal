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
/* # sessions                                                 # */
/* ############################################################ */

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    token TEXT DEFAULT uuid_generate_v4(),
    user_id INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE sessions
    ADD CONSTRAINT sessions_users_id
    FOREIGN KEY (user_id)
    REFERENCES users(id);

/* ############################################################ */
/* # verifications                                            # */
/* ############################################################ */

CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    code TEXT DEFAULT uuid_generate_v4(),
    user_id INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE verifications
    ADD CONSTRAINT verifications_users_id
    FOREIGN KEY (user_id)
    REFERENCES users(id);
