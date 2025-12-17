import { supabase } from './supabase'
import type { WeeklySession, DailySession, Programme } from './supabase'

// Simplified progress interface
export interface Progress {
  id: number
  programme_id: number
  wins: number
  losses: number
  total_days_completed: number
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

// Get all programmes
export async function getProgrammes(): Promise<Programme[]> {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching programmes:', error)
    return []
  }

  return data || []
}

// Get a specific programme by id
export async function getProgramme(id: number): Promise<Programme | null> {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching programme:', error)
    return null
  }

  return data
}

// Get progress for a specific programme
export async function getProgress(programmeId: number = 1): Promise<Progress | null> {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('programme_id', programmeId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching progress:', error)
    return null
  }

  return data
}

// Get or create progress for a programme
export async function getOrCreateProgress(programmeId: number = 1): Promise<Progress | null> {
  let progress = await getProgress(programmeId)
  
  if (!progress) {
    // Create new progress entry for this programme
    const { data, error } = await supabase
      .from('progress')
      .insert({
        programme_id: programmeId,
        wins: 0,
        losses: 0,
        total_days_completed: 0,
        current_streak: 0,
        longest_streak: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating progress:', error)
      return null
    }

    progress = data
  }

  return progress
}

// Get current week session for a specific programme
export async function getCurrentWeekSession(programmeId: number = 1): Promise<WeeklySession | null> {
  const startOfWeek = getStartOfWeek()
  
  const { data, error } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('week_start_date', startOfWeek)
    .eq('programme_id', programmeId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current week session:', error)
    return null
  }

  return data
}

// Create or update weekly session for a specific programme
export async function updateWeeklySession(completedDays: string[], programmeId: number = 1): Promise<WeeklySession | null> {
  const startOfWeek = getStartOfWeek()
  const isCompleted = completedDays.length === 3 // All 3 days completed
  
  const { data, error } = await supabase
    .from('weekly_sessions')
    .upsert({
      week_start_date: startOfWeek,
      programme_id: programmeId,
      completed_days: completedDays,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'programme_id,week_start_date'
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating weekly session:', error)
    return null
  }

  return data
}

// Record daily session completion for a specific programme
export async function recordDayCompletion(dayKey: string, exerciseIds: string[], programmeId: number = 1): Promise<DailySession | null> {
  const weeklySession = await getCurrentWeekSession(programmeId)
  
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

// Increment total days completed for a specific programme
export async function incrementTotalDays(programmeId: number = 1): Promise<boolean> {
  try {
    // First get current count
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    // Increment by 1
    const { error } = await supabase
      .from('progress')
      .update({
        total_days_completed: currentProgress.total_days_completed + 1,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error incrementing total days:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error incrementing total days:', error)
    return false
  }
}

// Decrement total days completed for a specific programme
export async function decrementTotalDays(programmeId: number = 1): Promise<boolean> {
  try {
    // First get current count
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    // Decrement by 1, but don't go below 0
    const newCount = Math.max(0, currentProgress.total_days_completed - 1)
    const { error } = await supabase
      .from('progress')
      .update({
        total_days_completed: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error decrementing total days:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error decrementing total days:', error)
    return false
  }
}

// Increment wins counter for a specific programme
export async function incrementWins(programmeId: number = 1): Promise<boolean> {
  try {
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    const { error } = await supabase
      .from('progress')
      .update({
        wins: currentProgress.wins + 1,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error incrementing wins:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error incrementing wins:', error)
    return false
  }
}

// Decrement wins counter for a specific programme
export async function decrementWins(programmeId: number = 1): Promise<boolean> {
  try {
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    // Decrement by 1, but don't go below 0
    const newCount = Math.max(0, currentProgress.wins - 1)
    const { error } = await supabase
      .from('progress')
      .update({
        wins: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error decrementing wins:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error decrementing wins:', error)
    return false
  }
}

// Increment losses counter for a specific programme
export async function incrementLosses(programmeId: number = 1): Promise<boolean> {
  try {
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    const { error } = await supabase
      .from('progress')
      .update({
        losses: currentProgress.losses + 1,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error incrementing losses:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error incrementing losses:', error)
    return false
  }
}

// Decrement losses counter for a specific programme
export async function decrementLosses(programmeId: number = 1): Promise<boolean> {
  try {
    const currentProgress = await getProgress(programmeId)
    if (!currentProgress) return false

    // Decrement by 1, but don't go below 0
    const newCount = Math.max(0, currentProgress.losses - 1)
    const { error } = await supabase
      .from('progress')
      .update({
        losses: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('programme_id', programmeId)

    if (error) {
      console.error('Error decrementing losses:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error decrementing losses:', error)
    return false
  }
}

// Reset progress for a specific programme (for development/testing)
export async function resetProgress(programmeId: number = 1): Promise<boolean> {
  try {
    // Get weekly sessions for this programme
    const { data: weeklySessions } = await supabase
      .from('weekly_sessions')
      .select('id')
      .eq('programme_id', programmeId)

    if (weeklySessions && weeklySessions.length > 0) {
      const sessionIds = weeklySessions.map(s => s.id)
      // Delete daily sessions for these weekly sessions
      await supabase
        .from('daily_sessions')
        .delete()
        .in('weekly_session_id', sessionIds)
    }

    // Delete weekly sessions for this programme
    await supabase
      .from('weekly_sessions')
      .delete()
      .eq('programme_id', programmeId)
    
    // Reset progress for this programme
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
      .eq('programme_id', programmeId)

    return true
  } catch (error) {
    console.error('Error resetting progress:', error)
    return false
  }
}

// Reset all progress for all programmes (for development/testing)
export async function resetAllProgress(): Promise<boolean> {
  try {
    // Delete all related data
    await supabase.from('daily_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('weekly_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Reset ALL progress for all programmes
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
      .neq('id', 0)

    return true
  } catch (error) {
    console.error('Error resetting all progress:', error)
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