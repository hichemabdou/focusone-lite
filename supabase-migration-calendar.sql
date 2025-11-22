-- Migration for Calendar Integration & Advanced Features

-- Add google_event_id to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Add reminders to goals (JSONB array)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;

-- Add sync_to_google flag to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS sync_to_google BOOLEAN DEFAULT FALSE;

-- Add google_refresh_token to users (for offline access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Index for google_event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_goals_google_event_id ON goals(google_event_id);
