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

// Helper function to clear all exercise completions from localStorage
function clearAllExerciseCompletions(): void {
  const days = ['day1', 'day2', 'day3']
  const exerciseCounts = [4, 4, 4] // Number of exercises per day (warmup + exercises + cooldown)
  
  days.forEach((day, dayIndex) => {
    // Clear warmup
    localStorage.removeItem(`${day}_warmup`)
    
    // Clear exercises (adjust based on your actual exercise counts)
    // For day1: 4 exercises, day2: 4 exercises, day3: 4 exercises
    for (let i = 0; i < exerciseCounts[dayIndex]; i++) {
      localStorage.removeItem(`${day}_exercise_${i}`)
    }
    
    // Clear cooldown
    localStorage.removeItem(`${day}_cooldown`)
  })
}

export const checkWeeklyReset = async (completedDays: string[]): Promise<boolean> => {
  try {
    // Get current date
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Only check for reset on Monday
    if (currentDay !== 1) {
      return false // Not Monday, no reset needed
    }

    // Check if we have stored the last reset date
    const lastResetKey = 'lastWeeklyReset'
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
      await incrementLosses()
    }

    // Clear all exercise completions from localStorage
    clearAllExerciseCompletions()

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
  // Force reset by clearing the last reset marker
  localStorage.removeItem('lastWeeklyReset')
  await checkWeeklyReset(completedDays)
}