import { isKeepingUpWithSchedule } from '../../lib/scheduleUtils'

interface AppNameProps {
  completedDays: string[]
}

export default function AppName({ completedDays }: AppNameProps) {
  const keepingUp = isKeepingUpWithSchedule(completedDays)
  
  return (
    <div className="w-full bg-black py-4 px-4">
      <h1 className="text-center text-4xl font-extrabold">
        {keepingUp ? (
          <>
            <span className="text-blue-500">Rise</span>
            <span className="text-white"> or </span>
            <span className="text-white">Fade</span>
          </>
        ) : (
          <>
            <span className="text-white">Rise</span>
            <span className="text-white"> or </span>
            <span className="text-red-500">Fade</span>
          </>
        )}
      </h1>
    </div>
  )
}