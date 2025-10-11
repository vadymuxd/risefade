import { supabase } from './supabase'
import type { WeeklySession, DailySession } from './supabase'

// Simplified progress interface
export interface Progress {
  id: number
  wins: number
  losses: number
  total_days_completed: number
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

// Get progress (single row)
export async function getProgress(): Promise<Progress | null> {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching progress:', error)
    return null
  }

  return data
}

// Get current week session
export async function getCurrentWeekSession(): Promise<WeeklySession | null> {
  const startOfWeek = getStartOfWeek()
  
  const { data, error } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('week_start_date', startOfWeek)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current week session:', error)
    return null
  }

  return data
}

// Create or update weekly session
export async function updateWeeklySession(completedDays: string[]): Promise<WeeklySession | null> {
  const startOfWeek = getStartOfWeek()
  const isCompleted = completedDays.length === 3 // All 3 days completed
  
  const { data, error } = await supabase
    .from('weekly_sessions')
    .upsert({
      week_start_date: startOfWeek,
      completed_days: completedDays,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'week_start_date'
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating weekly session:', error)
    return null
  }

  return data
}

// Record daily session completion
export async function recordDayCompletion(dayKey: string, exerciseIds: string[]): Promise<DailySession | null> {
  const weeklySession = await getCurrentWeekSession()
  
  if (!weeklySession) return null

  const { data, error } = await supabase
    .from('daily_sessions')
    .insert({
      weekly_session_id: weeklySession.id,
      day_key: dayKey,
      exercises_completed: exerciseIds,
      total_exercises: exerciseIds.length,
      completed_exercises: exerciseIds.length,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error recording day completion:', error)
    return null
  }

  return data
}

// Reset progress (for development/testing)
export async function resetProgress(): Promise<boolean> {
  try {
    // Delete all related data
    await supabase.from('daily_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('weekly_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Reset progress
    await supabase
      .from('progress')
      .update({
        wins: 0,
        losses: 0,
        total_days_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    return true
  } catch (error) {
    console.error('Error resetting progress:', error)
    return false
  }
}

// Helper function to get start of current week (Monday)
function getStartOfWeek(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}