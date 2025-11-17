-- FocusOne Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for username/password auth)
-- Note: If using Supabase Auth or NextAuth with OAuth only, this may not be needed
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL if OAuth only
  name VARCHAR(255),
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in-progress', 'blocked', 'done')),
  notes TEXT,
  milestone JSONB, -- Stores milestone object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (for goal comments)
CREATE TABLE IF NOT EXISTS goal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customizations table (categories, priorities, statuses)
CREATE TABLE IF NOT EXISTS customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('categories', 'priorities', 'statuses')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON goals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_comments_goal_id ON goal_comments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_comments_user_id ON goal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_customizations_user_id ON customizations(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Comments policies
CREATE POLICY "Users can view comments on own goals" ON goal_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals WHERE goals.id = goal_comments.goal_id AND goals.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert comments on own goals" ON goal_comments
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM goals WHERE goals.id = goal_comments.goal_id AND goals.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own comments" ON goal_comments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Customizations policies
CREATE POLICY "Users can view own customizations" ON customizations
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own customizations" ON customizations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own customizations" ON customizations
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own customizations" ON customizations
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customizations_updated_at BEFORE UPDATE ON customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
