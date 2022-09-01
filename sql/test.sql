/* ### create a test user ### */

INSERT INTO account (id, name) VALUES (1, 'Test User');
INSERT INTO device (uid, account_id) VALUES ('test-token', 1);
