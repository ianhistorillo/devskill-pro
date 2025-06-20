import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  preferred_languages: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'coding';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  created_at: string;
}

export interface Assessment {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_questions: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface UserAssessment {
  id: string;
  user_id: string;
  assessment_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score: number;
  total_points: number;
  time_taken_minutes?: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  assessment?: Assessment;
}

export interface CodingChallenge {
  id: string;
  category_id: string;
  title: string;
  description: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  starter_code: string;
  solution_code?: string;
  test_cases: any[];
  constraints?: string;
  time_limit_minutes: number;
  points: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface UserChallengeSubmission {
  id: string;
  user_id: string;
  challenge_id: string;
  code: string;
  language: string;
  status: 'submitted' | 'passed' | 'failed';
  test_results: any;
  execution_time_ms?: number;
  memory_used_kb?: number;
  score: number;
  submitted_at: string;
}