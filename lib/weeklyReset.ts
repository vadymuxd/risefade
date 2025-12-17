// Weekly reset logic
// This should be implemented as a proper background job in production
// For now, this is a basic implementation that can be triggered manually or on app load

import { incrementLosses } from './database'

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

function getProgrammePrefix(programmeId: number): string {
  return `p${programmeId}_`
}

// Clear all exercise completions for a specific programme from localStorage
function clearProgrammeExerciseCompletions(programmeId: number): void {
  const prefix = getProgrammePrefix(programmeId)
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

export const checkWeeklyReset = async (
  completedDays: string[],
  programmeId: number = 1
): Promise<boolean> => {
  try {
    // Get current date
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Only check for reset on Monday
    if (currentDay !== 1) {
      return false // Not Monday, no reset needed
    }

    // Check if we have stored the last reset date
    const lastResetKey = `lastWeeklyReset_programme_${programmeId}`
    const lastReset = localStorage.getItem(lastResetKey)
    const currentWeekStart = getStartOfWeek()
    
    // If we already reset this week, don't reset again
    // This is the critical check that ensures losses are only incremented ONCE per week
    if (lastReset === currentWeekStart) {
      return false
    }

    // At this point, we know:
    // 1. It's Monday
    // 2. We haven't reset for this week yet
    // 3. The completedDays array represents last week's progress
    
    // Check if all 3 days were completed last week
    const allDaysCompleted = completedDays.length === 3

    // If not all days completed last week, increment losses ONCE
    // This will only happen once per week because we set lastResetKey immediately after
    if (!allDaysCompleted) {
      await incrementLosses(programmeId)
    }

    // Clear all exercise completions from localStorage for this programme
    clearProgrammeExerciseCompletions(programmeId)

    // Mark that we've reset this week - this prevents losses from being incremented again
    // until the next Monday when currentWeekStart will be different
    localStorage.setItem(lastResetKey, currentWeekStart)
    
    return true // Reset performed
  } catch (error) {
    console.error('Error in weekly reset:', error)
    return false
  }
}

// Function to manually trigger weekly reset (for testing)
export const triggerWeeklyReset = async (completedDays: string[]): Promise<void> => {
  // Force reset by clearing the last reset marker for the default programme
  localStorage.removeItem('lastWeeklyReset_programme_1')
  await checkWeeklyReset(completedDays, 1)
}