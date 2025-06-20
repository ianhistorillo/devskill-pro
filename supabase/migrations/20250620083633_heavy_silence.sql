/*
  # DevSkill Pro Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with additional information
    - `categories` - Assessment categories (JavaScript, Python, React, etc.)
    - `questions` - Individual assessment questions
    - `assessments` - Collections of questions for specific topics
    - `assessment_questions` - Junction table linking assessments to questions
    - `user_assessments` - User assessment attempts and progress
    - `user_answers` - Individual user responses to questions
    - `coding_challenges` - Programming challenges with test cases
    - `user_challenge_submissions` - User code submissions for challenges

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for questions and challenges
*/

-- Profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  experience_level text DEFAULT 'beginner',
  preferred_languages text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories for organizing assessments
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice', -- multiple_choice, true_false, coding
  options jsonb, -- For multiple choice questions
  correct_answer text NOT NULL,
  explanation text,
  difficulty_level text DEFAULT 'medium', -- easy, medium, hard
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Assessments (collections of questions)
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 30,
  total_questions integer DEFAULT 10,
  difficulty_level text DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Junction table for assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  UNIQUE(assessment_id, question_id)
);

-- User assessment attempts
CREATE TABLE IF NOT EXISTS user_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  status text DEFAULT 'in_progress', -- in_progress, completed, abandoned
  score integer DEFAULT 0,
  total_points integer DEFAULT 0,
  time_taken_minutes integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User answers to questions
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_assessment_id uuid REFERENCES user_assessments(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  user_answer text,
  is_correct boolean DEFAULT false,
  points_earned integer DEFAULT 0,
  answered_at timestamptz DEFAULT now()
);

-- Coding challenges
CREATE TABLE IF NOT EXISTS coding_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty_level text DEFAULT 'medium',
  starter_code text DEFAULT '',
  solution_code text,
  test_cases jsonb NOT NULL DEFAULT '[]',
  constraints text,
  time_limit_minutes integer DEFAULT 60,
  points integer DEFAULT 100,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User challenge submissions
CREATE TABLE IF NOT EXISTS user_challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES coding_challenges(id) ON DELETE CASCADE,
  code text NOT NULL,
  language text DEFAULT 'javascript',
  status text DEFAULT 'submitted', -- submitted, passed, failed
  test_results jsonb DEFAULT '{}',
  execution_time_ms integer,
  memory_used_kb integer,
  score integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Policies for questions (public read)
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Policies for assessments (public read)
CREATE POLICY "Anyone can view active assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for assessment_questions (public read)
CREATE POLICY "Anyone can view assessment questions"
  ON assessment_questions FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_assessments
CREATE POLICY "Users can view own assessments"
  ON user_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON user_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON user_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_answers
CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_assessments 
    WHERE user_assessments.id = user_assessment_id 
    AND user_assessments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own answers"
  ON user_answers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_assessments 
    WHERE user_assessments.id = user_assessment_id 
    AND user_assessments.user_id = auth.uid()
  ));

-- Policies for coding_challenges (public read)
CREATE POLICY "Anyone can view active challenges"
  ON coding_challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for user_challenge_submissions
CREATE POLICY "Users can view own submissions"
  ON user_challenge_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON user_challenge_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();