-- CREATE TABLE mod_keys - Complete Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mod_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL CHECK (key_type IN ('FREE', 'PREMIUM')),
    
    -- Timing fields
    created_date DATE,
    duration_days INTEGER,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Payment fields
    price_vnd INTEGER,
    
    -- Link fields (for yeulink)
    short_link TEXT,
    destination_url TEXT,
    
    -- Status fields
    is_active BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Device binding fields (NEW)
    device_id TEXT,
    device_bound_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mod_keys_key_value ON mod_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_mod_keys_key_type ON mod_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_mod_keys_created_date ON mod_keys(created_date);
CREATE INDEX IF NOT EXISTS idx_mod_keys_is_active ON mod_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_keys_device_id ON mod_keys(device_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mod_keys_updated_at 
BEFORE UPDATE ON mod_keys
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE mod_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role
CREATE POLICY "Service role has full access to mod_keys" 
ON mod_keys
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Done! Table created successfully
-- You can now use the key system
