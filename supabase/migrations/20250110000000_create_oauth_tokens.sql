-- Create oauth_tokens table for storing encrypted OAuth refresh tokens
-- This table stores refresh tokens for both Google Drive and Garmin APIs

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Browser fingerprint or user identifier

  -- Google OAuth tokens
  google_refresh_token_encrypted TEXT,
  google_access_token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Garmin OAuth tokens
  garmin_refresh_token_encrypted TEXT,
  garmin_access_token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user_id
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own tokens
-- In a client-side app, we'll use the user_id as the identifier
-- The service_role key (used by Edge Functions) bypasses RLS
CREATE POLICY "Users can only access their own tokens"
  ON oauth_tokens
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE oauth_tokens IS 'Stores encrypted OAuth refresh tokens for Google Drive and Garmin APIs';
COMMENT ON COLUMN oauth_tokens.user_id IS 'Browser fingerprint or unique user identifier (not email)';
COMMENT ON COLUMN oauth_tokens.google_refresh_token_encrypted IS 'AES-256-GCM encrypted Google refresh token';
COMMENT ON COLUMN oauth_tokens.garmin_refresh_token_encrypted IS 'AES-256-GCM encrypted Garmin refresh token';
