
DELETE FROM channels WHERE name = 'general';
DROP INDEX idx_messages_created_at;
DROP INDEX idx_messages_user_id;
DROP INDEX idx_messages_channel_id;
DROP TABLE messages;
DROP TABLE channels;
