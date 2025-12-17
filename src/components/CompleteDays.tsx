import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getProgress } from '../../lib/database'

export interface CompleteDaysRef {
  incrementDays: () => void
  refreshFromDatabase: () => Promise<void>
}

interface CompleteDaysProps {
  programmeId?: number
  onIncrement?: () => void
  onDecrement?: () => void
}

const CompleteDays = forwardRef<CompleteDaysRef, CompleteDaysProps>(({ programmeId = 1, onIncrement, onDecrement }, ref) => {
  const [totalDays, setTotalDays] = useState<number>(0)

  // Load total days from database on mount
  useEffect(() => {
    loadProgress()
  }, [programmeId])

  const loadProgress = async () => {
    try {
      const progress = await getProgress(programmeId)
      if (progress) {
        setTotalDays(progress.total_days_completed)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  // Function to increment total days locally
  const incrementDays = () => {
    setTotalDays(prev => prev + 1)
  }

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    incrementDays,
    refreshFromDatabase: loadProgress
  }))

  return (
    <div className="w-full bg-black text-white text-center pb-4 px-4">
      <div className="flex items-center justify-between w-full">
        {onDecrement && (
          <button
            onClick={onDecrement}
            className="w-7 h-7 flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity text-white font-bold text-xl"
            aria-label="Зменшити дні"
          >
            −
          </button>
        )}
        <p className="text-lg font-medium">
          Днів завершено: {totalDays}
        </p>
        {onIncrement && (
          <button
            onClick={onIncrement}
            className="w-7 h-7 flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity text-white font-bold text-xl"
            aria-label="Збільшити дні"
          >
            +
          </button>
        )}
      </div>
    </div>
  )
})

CompleteDays.displayName = 'CompleteDays'

export default CompleteDays