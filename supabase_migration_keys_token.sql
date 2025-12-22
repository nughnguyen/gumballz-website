-- Add verification_token to mod_keys
ALTER TABLE mod_keys 
ADD COLUMN IF NOT EXISTS verification_token TEXT;
