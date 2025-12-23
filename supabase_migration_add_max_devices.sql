
ALTER TABLE mod_keys ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1;
COMMENT ON COLUMN mod_keys.max_devices IS 'Maximum number of unique devices that can use this key';
