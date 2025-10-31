-- Message reactions
CREATE TABLE IF NOT EXISTS reactions (
  id bigserial PRIMARY KEY,
  message_id bigint NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- A user can react with a particular emoji to a message at most once
CREATE UNIQUE INDEX IF NOT EXISTS reactions_unique_user_message_emoji
  ON reactions(message_id, user_id, emoji);

-- Helpful index for aggregations
CREATE INDEX IF NOT EXISTS reactions_message_idx ON reactions(message_id);


