-- Auth events table for tracking signups and logins
CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);

-- RLS policies
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auth events" ON auth_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert auth events" ON auth_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read auth events" ON auth_events
  FOR SELECT USING (true);
