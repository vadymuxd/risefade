import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Programme {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  programme_id: number
  wins: number
  losses: number
  total_days_completed: number
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

export interface WeeklySession {
  id: string
  user_id: string
  programme_id: number
  week_start_date: string
  is_completed: boolean
  completed_days: string[]
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface DailySession {
  id: string
  user_id: string
  weekly_session_id: string
  day_key: string
  completed_at: string
  exercises_completed: string[]
  total_exercises: number
  completed_exercises: number
  created_at: string
}

export interface ExerciseCompletion {
  id: string
  user_id: string
  daily_session_id: string
  exercise_id: string
  exercise_name: string
  completed_at: string
}