-- Add attachment support to messages and allow content to be nullable
ALTER TABLE messages
  ALTER COLUMN content DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS attachment_url text NULL,
  ADD COLUMN IF NOT EXISTS attachment_name text NULL,
  ADD COLUMN IF NOT EXISTS attachment_type text NULL,
  ADD COLUMN IF NOT EXISTS attachment_size integer NULL;


