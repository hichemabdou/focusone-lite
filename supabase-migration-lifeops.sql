-- Life Ops Center Database Migration
-- This migration adds support for:
-- - Work hours configuration
-- - AI insights and suggestions
-- - User preferences (including Google Calendar integration)
-- - Productivity metrics for analytics

-- ==============================================
-- 1. WORK HOURS CONFIGURATION
-- ==============================================
CREATE TABLE IF NOT EXISTS work_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- ==============================================
-- 2. AI INSIGHTS AND SUGGESTIONS
-- ==============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'scheduling', 'priority', 'balance', 'routine', 'bottleneck'
  title TEXT NOT NULL,
  description TEXT,
  action_type VARCHAR(50), -- 'create_goal', 'reschedule', 'adjust_priority', etc.
  action_payload JSONB, -- Structured data for the action
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'acted')),
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  created_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_status ON ai_insights(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at DESC);

-- ==============================================
-- 3. USER PREFERENCES
-- ==============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- General preferences
  theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
  start_of_week INTEGER DEFAULT 1 CHECK (start_of_week >= 0 AND start_of_week <= 6), -- 0=Sunday, 1=Monday
  
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Google Calendar Integration
  google_calendar_sync BOOLEAN DEFAULT FALSE,
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  google_calendar_id TEXT, -- Primary calendar to sync with
  
  -- AI Features
  ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
  auto_prioritization BOOLEAN DEFAULT FALSE,
  auto_scheduling BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 4. PRODUCTIVITY METRICS
-- ==============================================
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Daily metrics
  goals_completed INTEGER DEFAULT 0,
  goals_created INTEGER DEFAULT 0,
  goals_updated INTEGER DEFAULT 0,
  goals_deleted INTEGER DEFAULT 0,
  
  -- Category distribution (JSONB with category counts)
  categories_active JSONB DEFAULT '{}'::jsonb,
  categories_completed JSONB DEFAULT '{}'::jsonb,
  
  -- Time distribution (JSONB with hour-of-day counts)
  time_of_day_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Priority distribution
  priority_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Focus score for the day
  focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_productivity_metrics_user_date ON productivity_metrics(user_id, date DESC);

-- ==============================================
-- 5. GOOGLE CALENDAR SYNC LOG
-- ==============================================
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('to_google', 'from_google', 'bidirectional')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  items_synced INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_user ON calendar_sync_log(user_id, started_at DESC);

-- ==============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 7. CREATE RLS POLICIES
-- ==============================================

-- Work Hours Policies
DROP POLICY IF EXISTS "Users can only access their own work hours" ON work_hours;
CREATE POLICY "Users can only access their own work hours"
  ON work_hours
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Insights Policies
DROP POLICY IF EXISTS "Users can only access their own insights" ON ai_insights;
CREATE POLICY "Users can only access their own insights"
  ON ai_insights
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Preferences Policies
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;
CREATE POLICY "Users can only access their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Productivity Metrics Policies
DROP POLICY IF EXISTS "Users can only access their own metrics" ON productivity_metrics;
CREATE POLICY "Users can only access their own metrics"
  ON productivity_metrics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Calendar Sync Log Policies
DROP POLICY IF EXISTS "Users can only access their own sync logs" ON calendar_sync_log;
CREATE POLICY "Users can only access their own sync logs"
  ON calendar_sync_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- 8. CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_work_hours_updated_at ON work_hours;
CREATE TRIGGER update_work_hours_updated_at
    BEFORE UPDATE ON work_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_productivity_metrics_updated_at ON productivity_metrics;
CREATE TRIGGER update_productivity_metrics_updated_at
    BEFORE UPDATE ON productivity_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to initialize default preferences for a new user
CREATE OR REPLACE FUNCTION initialize_user_preferences(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create productivity metrics for a date
CREATE OR REPLACE FUNCTION get_or_create_daily_metrics(p_user_id UUID, p_date DATE)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO productivity_metrics (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO UPDATE
    SET updated_at = now()
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 10. SEED DEFAULT WORK HOURS (Optional)
-- ==============================================
-- Uncomment to create default work hours for existing users (9-5 Mon-Fri)
/*
INSERT INTO work_hours (user_id, day_of_week, start_time, end_time, is_active)
SELECT 
  id as user_id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00'::TIME as start_time,
  '17:00'::TIME as end_time,
  TRUE as is_active
FROM auth.users
ON CONFLICT (user_id, day_of_week) DO NOTHING;
*/

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
-- Summary:
-- ✓ Created work_hours table for configurable work schedules
-- ✓ Created ai_insights table for AI-powered suggestions
-- ✓ Created user_preferences table for app settings and integrations
-- ✓ Created productivity_metrics table for analytics
-- ✓ Created calendar_sync_log table for sync tracking
-- ✓ Enabled RLS on all tables
-- ✓ Created policies ensuring users only access their own data
-- ✓ Added automatic timestamp updates
-- ✓ Created helper functions for common operations
