-- Add column to track who modified the config
ALTER TABLE mod_configs 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT DEFAULT 'System';
