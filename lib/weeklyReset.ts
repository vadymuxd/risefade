// Weekly reset logic
// This should be implemented as a proper background job in production
// For now, this is a basic implementation that can be triggered manually or on app load

import { incrementLosses } from './database'

export const checkWeeklyReset = async (completedDays: string[]): Promise<boolean> => {
  try {
    // Get current date
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's Monday (day 1)
    if (currentDay !== 1) {
      return false // Not Monday, no reset needed
    }

    // Check if we have stored the last reset date
    const lastResetKey = 'lastWeeklyReset'
    const lastReset = localStorage.getItem(lastResetKey)
    const currentWeekStart = getStartOfWeek()
    
    // If we already reset this week, don't reset again
    if (lastReset === currentWeekStart) {
      return false
    }

    // Check if all days were completed last week
    const allDaysCompleted = completedDays.length === 3

    // If not all days completed, increment losses
    if (!allDaysCompleted) {
      await incrementLosses()
    }

    // Reset completed days (this should be done in the main component)
    // Mark that we've reset this week
    localStorage.setItem(lastResetKey, currentWeekStart)
    
    return true // Reset performed
  } catch (error) {
    console.error('Error in weekly reset:', error)
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

// Function to manually trigger weekly reset (for testing)
export const triggerWeeklyReset = async (completedDays: string[]): Promise<void> => {
  // Force reset by clearing the last reset marker
  localStorage.removeItem('lastWeeklyReset')
  await checkWeeklyReset(completedDays)
}