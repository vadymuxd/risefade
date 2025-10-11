import { isKeepingUpWithSchedule } from '../../lib/scheduleUtils'

interface WeekDayProps {
  completedDays: string[]
}

export default function WeekDay({ completedDays }: WeekDayProps) {
  // Ukrainian day labels
  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const currentDayIndex = today.getDay()
  // Convert to Monday = 0, Tuesday = 1, etc.
  const mondayBasedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1
  
  // Determine if we're keeping up with the schedule
  const keepingUp = isKeepingUpWithSchedule(completedDays)
  
  return (
    <div className="w-full py-4 px-4">
      <div className="flex justify-center items-center gap-2">
        {dayLabels.map((day, index) => {
          const isCurrent = index === mondayBasedIndex
          
          let dayClasses = "flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-center"
          
          if (isCurrent) {
            // Current day - color based on schedule adherence (no border)
            if (keepingUp) {
              dayClasses += " bg-blue-100 text-blue-700"
            } else {
              dayClasses += " bg-red-100 text-red-700"
            }
          } else {
            // Other days - white styling without border
            dayClasses += " bg-white text-gray-600"
          }
          
          return (
            <div
              key={index}
              className={dayClasses}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}