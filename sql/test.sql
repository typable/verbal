/* ### create a test user ### */

INSERT INTO account (id, username) VALUES (1, 'Test User');
INSERT INTO device (uid, account_id) VALUES ('test-token', 1);
