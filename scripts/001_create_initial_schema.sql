-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Create themes table
CREATE TABLE IF NOT EXISTS public.themes (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
  theme_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  UNIQUE(subject_id, theme_number)
);

-- Create topics table with numbering system (1.1.1, 1.2.1, etc.)
CREATE TABLE IF NOT EXISTS public.topics (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER REFERENCES public.themes(id) ON DELETE CASCADE,
  topic_code TEXT NOT NULL, -- e.g., "1.1.1", "1.2.1"
  title TEXT NOT NULL,
  content TEXT, -- Textbook content for this topic
  UNIQUE(theme_id, topic_code)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES public.topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'essay', 'calculation'
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  marks INTEGER NOT NULL,
  correct_answer TEXT,
  explanation TEXT,
  mark_scheme TEXT, -- Edexcel mark scheme for AI marking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question options for MCQs
CREATE TABLE IF NOT EXISTS public.question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES public.topics(id) ON DELETE CASCADE,
  completion_percentage INTEGER DEFAULT 0,
  mastery_level TEXT DEFAULT 'not_started', -- 'not_started', 'learning', 'practiced', 'mastered'
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Create user answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  highlighted_text TEXT[], -- Array of highlighted portions
  marks_awarded INTEGER,
  ai_feedback TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI tutor sessions table
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB, -- Store user's ability data and suggested topics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user weak topics tracking
CREATE TABLE IF NOT EXISTS public.user_weak_topics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES public.topics(id) ON DELETE CASCADE,
  weakness_score INTEGER DEFAULT 0, -- Higher score means more help needed
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weak_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_answers
CREATE POLICY "Users can view their own answers" ON public.user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own answers" ON public.user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tutor_sessions
CREATE POLICY "Users can view their own tutor sessions" ON public.tutor_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tutor sessions" ON public.tutor_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_weak_topics
CREATE POLICY "Users can view their own weak topics" ON public.user_weak_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own weak topics" ON public.user_weak_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own weak topics" ON public.user_weak_topics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for subject data (no RLS needed as these are reference tables)
-- Anyone can read subjects, themes, topics, questions, but only admins can modify
