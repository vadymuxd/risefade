import { isKeepingUpWithSchedule } from '../../lib/scheduleUtils'

interface AppNameProps {
  completedDays: string[]
}

export default function AppName({ completedDays }: AppNameProps) {
  const keepingUp = isKeepingUpWithSchedule(completedDays)
  
  return (
    <div className="w-full bg-black py-4 px-4">
      <h1 className="text-center text-5xl font-extrabold">
        {keepingUp ? (
          <>
            <span style={{ color: 'var(--blue)' }}>Rise</span>
            <span className="text-white"> or </span>
            <span className="text-white">Fade</span>
          </>
        ) : (
          <>
            <span className="text-white">Rise</span>
            <span className="text-white"> or </span>
            <span style={{ color: 'var(--red)' }}>Fade</span>
          </>
        )}
      </h1>
    </div>
  )
}