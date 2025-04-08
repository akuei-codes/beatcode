
-- Rating History Table: Tracks rating changes over time
CREATE TABLE IF NOT EXISTS rating_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL,
  battle_id UUID REFERENCES battles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- Policies for rating_history
-- Everyone can view rating history
CREATE POLICY "Rating history is viewable by everyone" 
ON rating_history
FOR SELECT 
USING (true);

-- Users can only add entries to their own rating history
CREATE POLICY "Users can add to their own rating history" 
ON rating_history
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only the user can update their own rating history
CREATE POLICY "Users can update their own rating history" 
ON rating_history
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_rating_history_user_id ON rating_history(user_id);

-- Create index for battle lookups
CREATE INDEX IF NOT EXISTS idx_rating_history_battle_id ON rating_history(battle_id);
