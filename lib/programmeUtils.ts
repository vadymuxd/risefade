import { supabase } from './supabase'
import type { Programme } from './supabase'

/**
 * Programme Management Utilities
 * Helper functions for managing workout programmes
 */

// Create a new programme
export async function createProgramme(
  name: string,
  description?: string,
  options?: { isActive?: boolean }
): Promise<Programme | null> {
  const isActive = options?.isActive ?? false

  const { data, error } = await supabase
    .from('programmes')
    .insert({
      name,
      description,
      is_active: isActive
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating programme:', error)
    return null
  }

  // Create initial progress entry for the new programme
  await supabase
    .from('progress')
    .insert({
      programme_id: data.id,
      wins: 0,
      losses: 0,
      total_days_completed: 0,
      current_streak: 0,
      longest_streak: 0
    })

  return data
}

// Get the currently active programme (should be exactly one)
export async function getActiveProgramme(): Promise<Programme | null> {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active programme:', error)
    return null
  }

  return data
}

// Set exactly one programme as active and mark all others inactive
export async function setActiveProgramme(id: number): Promise<boolean> {
  const now = new Date().toISOString()

  // Mark all other programmes inactive
  const { error: deactivateError } = await supabase
    .from('programmes')
    .update({ is_active: false, updated_at: now })
    .neq('id', id)

  if (deactivateError) {
    console.error('Error deactivating other programmes:', deactivateError)
    return false
  }

  // Mark selected programme active
  const { error: activateError } = await supabase
    .from('programmes')
    .update({ is_active: true, updated_at: now })
    .eq('id', id)

  if (activateError) {
    console.error('Error activating programme:', activateError)
    return false
  }

  return true
}

// Update programme details
export async function updateProgramme(
  id: number,
  updates: { name?: string; description?: string; is_active?: boolean }
): Promise<Programme | null> {
  const { data, error } = await supabase
    .from('programmes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating programme:', error)
    return null
  }

  return data
}

// Deactivate a programme (soft delete)
export async function deactivateProgramme(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('programmes')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating programme:', error)
    return false
  }

  return true
}

// Reactivate a programme
export async function activateProgramme(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('programmes')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error activating programme:', error)
    return false
  }

  return true
}

// Delete a programme permanently (will cascade delete all related data)
export async function deleteProgramme(id: number): Promise<boolean> {
  // Prevent deleting the default programme
  if (id === 1) {
    console.error('Cannot delete the default programme')
    return false
  }

  const { error } = await supabase
    .from('programmes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting programme:', error)
    return false
  }

  return true
}

// Get all programmes (including inactive)
export async function getAllProgrammes(includeInactive = false): Promise<Programme[]> {
  let query = supabase
    .from('programmes')
    .select('*')
    .order('id', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching programmes:', error)
    return []
  }

  return data || []
}

// Get programme with progress
export async function getProgrammeWithProgress(id: number): Promise<{
  programme: Programme | null
  progress: any | null
}> {
  const { data: programme, error: progError } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', id)
    .single()

  if (progError) {
    console.error('Error fetching programme:', progError)
    return { programme: null, progress: null }
  }

  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select('*')
    .eq('programme_id', id)
    .single()

  if (progressError && progressError.code !== 'PGRST116') {
    console.error('Error fetching progress:', progressError)
  }

  return {
    programme,
    progress: progress || null
  }
}

// Clone a programme (creates a new programme with the same name + " (Copy)")
export async function cloneProgramme(id: number): Promise<Programme | null> {
  const { data: original, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching original programme:', error)
    return null
  }

  return createProgramme(
    `${original.name} (Копія)`,
    original.description
  )
}

// Get programme statistics
export async function getProgrammeStats(id: number) {
  // Get progress
  const { data: progress } = await supabase
    .from('progress')
    .select('*')
    .eq('programme_id', id)
    .single()

  // Get total weeks
  const { data: weekSessions, count: totalWeeks } = await supabase
    .from('weekly_sessions')
    .select('*', { count: 'exact', head: false })
    .eq('programme_id', id)

  // Get completed weeks
  const { count: completedWeeks } = await supabase
    .from('weekly_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('programme_id', id)
    .eq('is_completed', true)

  // Get current week session
  const startOfWeek = getStartOfWeek()
  const { data: currentWeek } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('programme_id', id)
    .eq('week_start_date', startOfWeek)
    .single()

  return {
    progress: progress || {
      wins: 0,
      losses: 0,
      total_days_completed: 0,
      current_streak: 0,
      longest_streak: 0
    },
    totalWeeks: totalWeeks || 0,
    completedWeeks: completedWeeks || 0,
    currentWeek: currentWeek || null,
    completionRate: totalWeeks ? ((completedWeeks || 0) / totalWeeks) * 100 : 0
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
