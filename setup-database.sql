-- SharkIN Database Setup
-- Kør denne SQL i Supabase SQL Editor

-- 1. Opret users tabel
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  default_language TEXT DEFAULT 'da',
  default_tone TEXT DEFAULT 'professional',
  
  monthly_credits_used INT DEFAULT 0,
  monthly_credits_limit INT DEFAULT 100
);

-- 2. Opret generated_hooks tabel
CREATE TABLE generated_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  input_text TEXT NOT NULL,
  language TEXT NOT NULL,
  tone TEXT NOT NULL,
  target_audience TEXT,
  
  hooks JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_generated_hooks_user ON generated_hooks(user_id);

-- 4. Function til at opdatere credits
CREATE OR REPLACE FUNCTION increment_credits(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET monthly_credits_used = monthly_credits_used + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own hooks" ON generated_hooks
  FOR ALL USING (auth.uid() = user_id);

-- FÆRDIG! Tabellerne er nu oprettet.
