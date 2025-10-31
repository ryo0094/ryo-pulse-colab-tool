-- Revert attachment support on messages and make content NOT NULL again
ALTER TABLE messages
  DROP COLUMN IF EXISTS attachment_url,
  DROP COLUMN IF EXISTS attachment_name,
  DROP COLUMN IF EXISTS attachment_type,
  DROP COLUMN IF EXISTS attachment_size,
  ALTER COLUMN content SET NOT NULL;


