import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getProgress } from '../../lib/database'
import type { Progress } from '../../lib/database'

export interface CompleteDaysRef {
  incrementDays: () => void
  refreshFromDatabase: () => Promise<void>
}

const CompleteDays = forwardRef<CompleteDaysRef>((props, ref) => {
  const [totalDays, setTotalDays] = useState<number>(0)

  // Load total days from database on mount
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const progress = await getProgress()
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
    <div className="w-full bg-black text-white text-center py-4 px-4 mb-4">
      <p className="text-lg font-medium">
        Днів завершено: {totalDays}
      </p>
    </div>
  )
})

CompleteDays.displayName = 'CompleteDays'

export default CompleteDays