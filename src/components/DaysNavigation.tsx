'use client';

interface DaysNavigationProps {
  activeDay: string;
  completedDays: string[];
  onDayChange: (day: string) => void;
  keepingUpWithSchedule: boolean;
}

export default function DaysNavigation({ activeDay, completedDays, onDayChange, keepingUpWithSchedule }: DaysNavigationProps) {
  const days = ['day1', 'day2', 'day3'];
  
  const getDayStatus = (dayKey: string) => {
    if (completedDays.includes(dayKey)) {
      return 'completed';
    }
    if (dayKey === activeDay) {
      return 'active';
    }
    return 'inactive';
  };

  const getButtonStyles = (dayKey: string) => {
    const status = getDayStatus(dayKey);
    
    // Use red colors if not keeping up with schedule, blue if keeping up
    const primaryColor = keepingUpWithSchedule ? 'blue' : 'red';
    
    switch (status) {
      case 'completed':
        return keepingUpWithSchedule 
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-red-600 text-white border-red-600';
      case 'active':
        return keepingUpWithSchedule
          ? 'bg-white text-blue-600 border-blue-600'
          : 'bg-white text-red-600 border-red-600';
      default:
        return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      {days.map((dayKey, index) => (
        <button
          key={dayKey}
          onClick={() => onDayChange(dayKey)}
          className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all cursor-pointer ${getButtonStyles(dayKey)}`}
        >
          День {index + 1}
        </button>
      ))}
    </div>
  );
}