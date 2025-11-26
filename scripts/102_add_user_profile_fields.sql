-- Add fields to profiles table for onboarding and skill tracking

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_grade TEXT,
ADD COLUMN IF NOT EXISTS target_grade TEXT,
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subjects_selected TEXT[] DEFAULT '{}';

-- Create active recall tracking table
CREATE TABLE IF NOT EXISTS active_recall_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  last_attempted TIMESTAMP WITH TIME ZONE,
  next_review_date TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on active recall table
ALTER TABLE active_recall_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for active recall
CREATE POLICY "Users can view their own active recall queue"
ON active_recall_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active recall items"
ON active_recall_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active recall items"
ON active_recall_queue FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_active_recall_user_next_review 
ON active_recall_queue(user_id, next_review_date);
