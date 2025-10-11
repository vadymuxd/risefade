import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getProgress } from '../../lib/database'

export interface BattleProgressRef {
  refreshFromDatabase: () => Promise<void>
}

interface BattleProgressProps {
  keepingUpWithSchedule?: boolean
}

const BattleProgress = forwardRef<BattleProgressRef, BattleProgressProps>(({ keepingUpWithSchedule = true }, ref) => {
  const [wins, setWins] = useState<number>(0)
  const [losses, setLosses] = useState<number>(0)

  // Load progress from database on mount
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const progress = await getProgress()
      if (progress) {
        setWins(progress.wins)
        setLosses(progress.losses)
      }
    } catch (error) {
      console.error('Error loading battle progress:', error)
    }
  }

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshFromDatabase: loadProgress
  }))

  // Create array of 10 icons for each bar
  const createIconArray = (count: number, maxIcons: number = 10) => {
    return Array.from({ length: maxIcons }, (_, index) => index < count)
  }

  const riseIcons = createIconArray(wins)
  const fadeIcons = createIconArray(losses)

  return (
  <div className="w-full py-4 px-4" style={{ backgroundColor: '#202020ff' }}>
      {/* Rise Bar */}
      <div className="mb-3">
        <div className="flex justify-center items-center gap-1">
          {riseIcons.map((isActive, index) => (
            <div key={`rise-${index}`} className="w-6 h-6">
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: isActive 
                    ? (keepingUpWithSchedule ? 'var(--blue)' : '#ffffff')
                    : '#666666',
                  mask: 'url(/Rise.svg) no-repeat center/contain',
                  WebkitMask: 'url(/Rise.svg) no-repeat center/contain'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fade Bar */}
      <div>
        <div className="flex justify-center items-center gap-1">
          {fadeIcons.map((isActive, index) => (
            <div key={`fade-${index}`} className="w-6 h-6">
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: isActive 
                    ? (keepingUpWithSchedule ? '#ffffff' : 'var(--red)')
                    : '#666666',
                  mask: 'url(/Fade.svg) no-repeat center/contain',
                  WebkitMask: 'url(/Fade.svg) no-repeat center/contain'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

BattleProgress.displayName = 'BattleProgress'

export default BattleProgress