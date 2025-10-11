'use client';

import { useState, useEffect, useRef } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import DaysNavigation from '@/components/DaysNavigation';
import CompleteDays, { CompleteDaysRef } from '@/components/CompleteDays';
import WeekDay from '@/components/WeekDay';
import AppName from '@/components/AppName';
import { recordDayCompletion, updateWeeklySession, incrementTotalDays, resetAllProgress } from '../../lib/database';
import { isKeepingUpWithSchedule } from '../../lib/scheduleUtils';

export default function Home() {
  const [activeDay, setActiveDay] = useState('day1');
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [exerciseCompletions, setExerciseCompletions] = useState<Record<string, boolean>>({});
  const [canCompleteDay, setCanCompleteDay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Ref for the CompleteDays component
  const completeDaysRef = useRef<CompleteDaysRef>(null);

  const plans = {
    day1: {
      title: "День 1: Фокус на Прес та Ноги",
      warmup: { 
        name: "Розминка (5-7 хвилин)", 
        desc: "Обов'язково підготуйте тіло: ходьба на місці, обертання суглобами, динамічна розтяжка." 
      },
      exercises: [
        { 
          name: "Присідання", 
          reps: "3 підходи по 15 повторень", 
          desc: "Тримайте спину прямо, ноги на ширині плечей. Опускайтеся так, ніби сідаєте на стілець.", 
          video: "https://www.youtube.com/embed/l83R5PblSMA" 
        },
        { 
          name: "Сідничний місток", 
          reps: "3 підходи по 20 повторень", 
          desc: "Лежачи на спині, зігніть коліна. Піднімайте таз вгору, напружуючи сідниці.", 
          video: "https://www.youtube.com/embed/tqp5XQPpTxY" 
        },
        { 
          name: "\"Велосипед\"", 
          reps: "3 підходи по 30 секунд", 
          desc: "Лежачи на спині, руки за головою. По черзі тягніться правим ліктем до лівого коліна і навпаки.", 
          video: "https://www.youtube.com/embed/wnuLak2onoA" 
        },
        { 
          name: "Вправa \"Мертвий жук\"", 
          reps: "3 підходи по 12 на сторону", 
          desc: "Лежачи на спині, повільно опустіть протилежні руку і ногу, не торкаючись підлоги.", 
          video: "https://www.youtube.com/embed/9RK9UUgKIQE" 
        }
      ],
      cooldown: { 
        name: "Заминка (5 хвилин)", 
        desc: "Обов'язково розтягніть м'язи, що працювали, особливо м'язи ніг та пресу." 
      }
    },
    day2: {
      title: "День 2: Кардіо та М'язи Кору",
      warmup: { 
        name: "Розминка (5-7 хвилин)", 
        desc: "Легке кардіо для розігріву: ходьба на місці, махи руками та ногами." 
      },
      exercises: [
        { 
          name: "Стрибки \"Jumping Jacks\"", 
          reps: "3 підходи по 45 секунд", 
          desc: "Якщо стрибки викликають дискомфорт, робіть кроки по черзі.", 
          video: "https://www.youtube.com/embed/ttVmvj88Zwc" 
        },
        { 
          name: "Високе піднімання колін", 
          reps: "3 підходи по 30 секунд", 
          desc: "Стоячи на місці, бігайте, піднімаючи коліна якомога вище. Тримайте прес напруженим.", 
          video: "https://www.youtube.com/embed/sTvekaq6vOU" 
        },
        { 
          name: "Підйоми ніг лежачи", 
          reps: "3 підходи по 15 повторень", 
          desc: "Повільно піднімайте прямі ноги догори до кута 90 градусів і так само повільно опускайте.", 
          video: "https://www.youtube.com/embed/Wp4BlxcFTkE" 
        },
        { 
          name: "Зворотні скручування", 
          reps: "3 підходи по 15 повторень", 
          desc: "Лежачи на спині, піднімайте ноги і таз вгору так, тягнучи коліна до грудей.", 
          video: "https://www.youtube.com/embed/XY8KzdDcMFg" 
        }
      ],
      cooldown: { 
        name: "Заминка (5 хвилин)", 
        desc: "Зробіть легку розтяжку для всього тіла, щоб заспокоїти серцевий ритм." 
      }
    },
    day3: {
      title: "День 3: Сила Кору та Ніг",
      warmup: { 
        name: "Розминка (5-7 хвилин)", 
        desc: "Підготуйте м'язи до роботи: кілька присідань без ваги та нахилів." 
      },
      exercises: [
        { 
          name: "Випади", 
          reps: "3 підходи по 12 на ногу", 
          desc: "Зробіть крок вперед і опустіться, згинаючи обидві ноги під кутом 90 градусів.", 
          video: "https://www.youtube.com/embed/mTrWpTHrs_Y" 
        },
        { 
          name: "Зворотні скручування", 
          reps: "3 підходи по 15 повторень", 
          desc: "Лежачи на спині, піднімайте ноги і таз вгору так, тягнучи коліна до грудей.", 
          video: "https://www.youtube.com/embed/XY8KzdDcMFg" 
        },
        { 
          name: "Вправa \"Мертвий жук\"", 
          reps: "3 підходи по 12 на сторону", 
          desc: "Лежачи на спині, повільно опустіть протилежні руку і ногу, не торкаючись підлоги.", 
          video: "https://www.youtube.com/embed/9RK9UUgKIQE" 
        },
        { 
          name: "Бічна планка на лікті", 
          reps: "3 підходи по 20-30 сек на сторону", 
          desc: "Лежачи на боці, підніміть тіло, спираючись на лікоть. Тіло має утворювати пряму лінію.", 
          video: "https://www.youtube.com/embed/mTrWpTHrs_Y" 
        }
      ],
      cooldown: { 
        name: "Заминка (5 хвилин)", 
        desc: "Приділіть увагу розтяжці косих м'язів живота та ніг." 
      }
    }
  };

  // Load completed days from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('completedDays');
      if (saved) {
        setCompletedDays(JSON.parse(saved));
      }
    }
  }, []);

  // Update canCompleteDay when activeDay, completedDays, or exerciseCompletions change
  useEffect(() => {
    if (mounted) {
      const dayCompleted = isDayCompleted(activeDay);
      const dayNotInCompleted = !completedDays.includes(activeDay);
      setCanCompleteDay(dayCompleted && dayNotInCompleted);
    }
  }, [activeDay, completedDays, exerciseCompletions, mounted]);

  // Get all exercise IDs for a day
  const getDayExerciseIds = (dayKey: string) => {
    const plan = plans[dayKey as keyof typeof plans];
    const ids = [
      `${dayKey}_warmup`,
      ...plan.exercises.map((_, index) => `${dayKey}_exercise_${index}`),
      `${dayKey}_cooldown`
    ];
    return ids;
  };

  // Check if all exercises in a day are completed
  const isDayCompleted = (dayKey: string) => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const exerciseIds = getDayExerciseIds(dayKey);
    return exerciseIds.every(id => {
      const saved = localStorage.getItem(id);
      return saved === 'true';
    });
  };

  // Handle exercise completion change
  const handleExerciseCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseCompletions(prev => ({
      ...prev,
      [exerciseId]: completed
    }));
  };

  // Handle completing a day
  const handleCompleteDay = async () => {
    const newCompletedDays = [...completedDays, activeDay];
    setCompletedDays(newCompletedDays);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('completedDays', JSON.stringify(newCompletedDays));
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Save to database
    try {
      // Get all exercise IDs for this day
      const exerciseIds = getDayExerciseIds(activeDay);
      
      // Record day completion in database
      await recordDayCompletion(activeDay, exerciseIds);
      
      // Update weekly session with completed days
      await updateWeeklySession(newCompletedDays);
      
      // Increment total days in database
      const success = await incrementTotalDays();
      
      if (success) {
        // Refresh the counter from database to ensure accuracy
        if (completeDaysRef.current) {
          await completeDaysRef.current.refreshFromDatabase();
        }
      } else {
        // Fallback: just increment UI if database fails
        if (completeDaysRef.current) {
          completeDaysRef.current.incrementDays();
        }
      }
    } catch (error) {
      console.error('Error saving day completion to database:', error);
      // Fallback: just increment UI if database fails
      if (completeDaysRef.current) {
        completeDaysRef.current.incrementDays();
      }
    }

    // Navigate to next day
    const days = ['day1', 'day2', 'day3'];
    const currentIndex = days.indexOf(activeDay);
    if (currentIndex < days.length - 1) {
      setActiveDay(days[currentIndex + 1]);
    }
  };

  // Handle resetting all progress
  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      // Clear completed days
      localStorage.removeItem('completedDays');
      setCompletedDays([]);
      
      // Clear all exercise completion states
      const allExerciseIds: string[] = [];
      ['day1', 'day2', 'day3'].forEach(dayKey => {
        const exerciseIds = getDayExerciseIds(dayKey);
        allExerciseIds.push(...exerciseIds);
      });
      
      allExerciseIds.forEach(id => {
        localStorage.removeItem(id);
      });
      
      // Reset exercise completions state
      setExerciseCompletions({});
      
      // Reset to day 1
      setActiveDay('day1');
      
      // Trigger re-render of ExerciseCard components
      setResetTrigger(prev => prev + 1);
    }
  };

  // Handle resetting all progress (including total days)
  const handleResetAllProgress = async () => {
    if (typeof window !== 'undefined') {
      // Clear completed days
      localStorage.removeItem('completedDays');
      setCompletedDays([]);
      
      // Clear all exercise completion states
      const allExerciseIds: string[] = [];
      ['day1', 'day2', 'day3'].forEach(dayKey => {
        const exerciseIds = getDayExerciseIds(dayKey);
        allExerciseIds.push(...exerciseIds);
      });
      
      allExerciseIds.forEach(id => {
        localStorage.removeItem(id);
      });
      
      // Reset exercise completions state
      setExerciseCompletions({});
      
      // Reset to day 1
      setActiveDay('day1');
      
      // Trigger re-render of ExerciseCard components
      setResetTrigger(prev => prev + 1);
      
      // Reset database progress
      try {
        await resetAllProgress();
        // Refresh the total days counter from database
        if (completeDaysRef.current) {
          await completeDaysRef.current.refreshFromDatabase();
        }
      } catch (error) {
        console.error('Error resetting all progress in database:', error);
      }
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* App Name - Full Width */}
      <AppName completedDays={completedDays} />
      
      {/* Complete Days Tracker - Full Width */}
      <CompleteDays ref={completeDaysRef} />
      
      {/* Week Day Tracker - Full Width */}
      <WeekDay completedDays={completedDays} />
      
      <div className="max-w-full mx-auto p-4">
        {/* Days Navigation */}
        <DaysNavigation 
          activeDay={activeDay}
          completedDays={completedDays}
          onDayChange={setActiveDay}
          keepingUpWithSchedule={isKeepingUpWithSchedule(completedDays)}
        />

        {/* Content */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-4">
            {plans[activeDay as keyof typeof plans].title}
          </h2>

          {/* Warmup */}
          <ExerciseCard
            key={`${activeDay}_warmup_${resetTrigger}`}
            id={`${activeDay}_warmup`}
            name={plans[activeDay as keyof typeof plans].warmup.name}
            desc={plans[activeDay as keyof typeof plans].warmup.desc}
            isUtility={true}
            onCompletionChange={handleExerciseCompletion}
          />

          {/* Exercises */}
          {plans[activeDay as keyof typeof plans].exercises.map((exercise, index) => (
            <ExerciseCard
              key={`${activeDay}_exercise_${index}_${resetTrigger}`}
              id={`${activeDay}_exercise_${index}`}
              name={exercise.name}
              reps={exercise.reps}
              desc={exercise.desc}
              video={exercise.video}
              onCompletionChange={handleExerciseCompletion}
            />
          ))}

          {/* Cooldown */}
          <ExerciseCard
            key={`${activeDay}_cooldown_${resetTrigger}`}
            id={`${activeDay}_cooldown`}
            name={plans[activeDay as keyof typeof plans].cooldown.name}
            desc={plans[activeDay as keyof typeof plans].cooldown.desc}
            isUtility={true}
            onCompletionChange={handleExerciseCompletion}
          />

          {/* Complete Day Button */}
          {canCompleteDay && (
            <div className="mt-6 text-center">
              <button
                onClick={handleCompleteDay}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                Завершити День
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-4 text-sm text-gray-500 p-5">
          <p className="mb-3">Головне — регулярність! Навіть коротке тренування краще, ніж нічого. Успіхів!</p>
          <div className="space-y-2">
            <button
              onClick={handleResetProgress}
              className="block text-xs text-red-500 hover:text-red-700 underline transition-colors cursor-pointer mx-auto"
            >
              Скинути недільний прогрес
            </button>
            <button
              onClick={handleResetAllProgress}
              className="block text-xs text-red-500 hover:text-red-700 underline transition-colors cursor-pointer mx-auto"
            >
              Скинути весь прогрес
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
