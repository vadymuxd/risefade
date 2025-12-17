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

  const getButtonStyles = () => {
    return 'flex-1 py-3 px-4 rounded-lg border font-medium transition-all cursor-pointer';
  };

  const getButtonStyle = (dayKey: string): React.CSSProperties => {
    const status = getDayStatus(dayKey);
    
    switch (status) {
      case 'completed':
        return keepingUpWithSchedule 
          ? { backgroundColor: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' }
          : { backgroundColor: 'var(--red)', color: 'white', borderColor: 'var(--red)' };
      case 'active':
        return keepingUpWithSchedule
          ? { backgroundColor: 'white', color: 'var(--blue)', borderColor: 'var(--blue)' }
          : { backgroundColor: 'white', color: 'var(--red)', borderColor: 'var(--red)' };
      default:
        return { backgroundColor: 'white', color: '#374151', borderColor: '#D1D5DB' }; // gray-700, gray-300
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      {days.map((dayKey, index) => (
        <button
          key={dayKey}
          onClick={() => onDayChange(dayKey)}
          className={getButtonStyles(dayKey)}
          style={getButtonStyle(dayKey)}
          onMouseEnter={(e) => {
            if (getDayStatus(dayKey) === 'inactive') {
              e.currentTarget.style.backgroundColor = '#F9FAFB'; // gray-50
            }
          }}
          onMouseLeave={(e) => {
            if (getDayStatus(dayKey) === 'inactive') {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          День {index + 1}
        </button>
      ))}
    </div>
  );
}