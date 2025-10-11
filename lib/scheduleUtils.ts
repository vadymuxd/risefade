// Utility function to determine if keeping up with the exercise schedule
// Schedule: Day1 on Monday, Day2 on Wednesday, Day3 on Friday
export const isKeepingUpWithSchedule = (completedDays: string[]): boolean => {
  const today = new Date()
  const currentDayIndex = today.getDay()
  // Convert to Monday = 0, Tuesday = 1, etc.
  const mondayBasedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1
  
  const completedCount = completedDays.length
  
  switch (mondayBasedIndex) {
    case 0: // Monday
      return true // Always good on Monday (start of schedule)
    
    case 1: // Tuesday
      return completedCount >= 1 // Should have completed day1 (Monday)
    
    case 2: // Wednesday  
      return completedCount >= 1 // Should have completed day1 by Wednesday
    
    case 3: // Thursday
      return completedCount >= 2 // Should have completed day1 + day2 (Wed) by Thursday
    
    case 4: // Friday
      return completedCount >= 2 // Should have completed day1 + day2 by Friday
    
    case 5: // Saturday
    case 6: // Sunday
      return completedCount >= 3 // Should have completed all 3 days by weekend
    
    default:
      return false
  }
}