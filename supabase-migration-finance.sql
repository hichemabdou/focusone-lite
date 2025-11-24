-- Finance Module Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FINANCIAL ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
    'checking', 'savings', 'credit_card', 'investment', 
    'brokerage', 'loan', 'mortgage', 'other'
  )),
  institution VARCHAR(255),
  account_number_last4 VARCHAR(4), -- Last 4 digits for identification
  currency VARCHAR(3) DEFAULT 'USD',
  is_asset BOOLEAN NOT NULL, -- true for assets, false for liabilities
  current_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_financial_accounts_user_id ON financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_type ON financial_accounts(account_type);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL, -- Positive for income/credits, negative for expenses/debits
  category VARCHAR(100),
  transaction_type VARCHAR(50) CHECK (transaction_type IN (
    'income', 'expense', 'transfer', 'investment', 'other'
  )),
  is_recurring BOOLEAN DEFAULT FALSE,
  source_file VARCHAR(255), -- Track which file this came from
  hash VARCHAR(64) UNIQUE, -- For duplicate detection
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_hash ON transactions(hash);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- ============================================================================
-- NET WORTH SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets DECIMAL(15, 2) NOT NULL,
  total_liabilities DECIMAL(15, 2) NOT NULL,
  net_worth DECIMAL(15, 2) NOT NULL,
  asset_breakdown JSONB, -- {"cash": 15000, "investments": 45000, "property": 250000}
  liability_breakdown JSONB, -- {"mortgage": 180000, "loans": 15000}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_net_worth_user_date ON net_worth_snapshots(user_id, snapshot_date);

-- ============================================================================
-- FINANCIAL INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'positive', 'warning', 'info', 'recommendation'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_label VARCHAR(100),
  action_data JSONB, -- Additional data for the action
  is_dismissed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_financial_insights_user_id ON financial_insights(user_id);
CREATE INDEX idx_financial_insights_dismissed ON financial_insights(is_dismissed);
CREATE INDEX idx_financial_insights_priority ON financial_insights(priority);

-- ============================================================================
-- UPLOADED FILES TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS uploaded_financial_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('pdf', 'csv', 'xlsx', 'ofx', 'qfx')),
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  transactions_extracted INTEGER DEFAULT 0,
  accounts_detected INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  storage_path TEXT, -- Supabase storage path if we store the file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_uploaded_files_user_id ON uploaded_financial_files(user_id);
CREATE INDEX idx_uploaded_files_status ON uploaded_financial_files(processing_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Financial Accounts RLS
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial accounts" ON financial_accounts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own financial accounts" ON financial_accounts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own financial accounts" ON financial_accounts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own financial accounts" ON financial_accounts
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Net Worth Snapshots RLS
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own net worth snapshots" ON net_worth_snapshots
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own net worth snapshots" ON net_worth_snapshots
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own net worth snapshots" ON net_worth_snapshots
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own net worth snapshots" ON net_worth_snapshots
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Financial Insights RLS
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial insights" ON financial_insights
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own financial insights" ON financial_insights
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own financial insights" ON financial_insights
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own financial insights" ON financial_insights
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Uploaded Files RLS
ALTER TABLE uploaded_financial_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploaded files" ON uploaded_financial_files
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own uploaded files" ON uploaded_financial_files
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own uploaded files" ON uploaded_financial_files
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own uploaded files" ON uploaded_financial_files
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_financial_accounts_updated_at 
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create net worth snapshot
CREATE OR REPLACE FUNCTION create_net_worth_snapshot(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_assets DECIMAL(15, 2);
  v_total_liabilities DECIMAL(15, 2);
  v_net_worth DECIMAL(15, 2);
  v_asset_breakdown JSONB;
  v_liability_breakdown JSONB;
BEGIN
  -- Calculate total assets
  SELECT COALESCE(SUM(current_balance), 0)
  INTO v_total_assets
  FROM financial_accounts
  WHERE user_id = p_user_id AND is_asset = true;

  -- Calculate total liabilities
  SELECT COALESCE(SUM(ABS(current_balance)), 0)
  INTO v_total_liabilities
  FROM financial_accounts
  WHERE user_id = p_user_id AND is_asset = false;

  -- Calculate net worth
  v_net_worth := v_total_assets - v_total_liabilities;

  -- Build asset breakdown
  SELECT jsonb_object_agg(account_type, total)
  INTO v_asset_breakdown
  FROM (
    SELECT account_type, SUM(current_balance) as total
    FROM financial_accounts
    WHERE user_id = p_user_id AND is_asset = true
    GROUP BY account_type
  ) assets;

  -- Build liability breakdown
  SELECT jsonb_object_agg(account_type, total)
  INTO v_liability_breakdown
  FROM (
    SELECT account_type, SUM(ABS(current_balance)) as total
    FROM financial_accounts
    WHERE user_id = p_user_id AND is_asset = false
    GROUP BY account_type
  ) liabilities;

  -- Insert or update snapshot for today
  INSERT INTO net_worth_snapshots (
    user_id, 
    snapshot_date, 
    total_assets, 
    total_liabilities, 
    net_worth,
    asset_breakdown,
    liability_breakdown
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    v_total_assets,
    v_total_liabilities,
    v_net_worth,
    COALESCE(v_asset_breakdown, '{}'::jsonb),
    COALESCE(v_liability_breakdown, '{}'::jsonb)
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_assets = EXCLUDED.total_assets,
    total_liabilities = EXCLUDED.total_liabilities,
    net_worth = EXCLUDED.net_worth,
    asset_breakdown = EXCLUDED.asset_breakdown,
    liability_breakdown = EXCLUDED.liability_breakdown;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
-- INSERT INTO financial_accounts (user_id, account_name, account_type, institution, is_asset, current_balance)
-- VALUES 
--   (auth.uid(), 'Checking Account', 'checking', 'Chase', true, 5000.00),
--   (auth.uid(), 'Savings Account', 'savings', 'Chase', true, 15000.00),
--   (auth.uid(), 'Investment Portfolio', 'investment', 'Vanguard', true, 45000.00),
--   (auth.uid(), 'Credit Card', 'credit_card', 'Chase', false, -2500.00);
