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
    <div className="w-full pt-4 px-4">
      <div className="flex justify-center items-center gap-2">
        {dayLabels.map((day, index) => {
          const isCurrent = index === mondayBasedIndex
          let style: React.CSSProperties = {}
          let dayClasses = "flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-center"
          if (isCurrent) {
            // Current day - color based on schedule adherence (no border)
            if (keepingUp) {
              style = { background: 'var(--light-blue)', color: 'var(--blue)' }
            } else {
              style = { background: 'var(--light-red)', color: 'var(--red)' }
            }
          } else {
            // Other days - white styling without border
            style = { background: '#fff', color: '#4B5563' } // gray-600
          }
          return (
            <div
              key={index}
              className={dayClasses}
              style={style}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}