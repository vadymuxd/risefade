'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import ExerciseCard from '@/components/ExerciseCard';
import DaysNavigation from '@/components/DaysNavigation';
import CompleteDays, { CompleteDaysRef } from '@/components/CompleteDays';
import WeekDay from '@/components/WeekDay';
import AppName from '@/components/AppName';
import BattleProgress, { BattleProgressRef } from '@/components/BattleProgress';
import ProgrammesNavigation from '@/components/ProgrammesNavigation';
import { recordDayCompletion, updateWeeklySession, incrementTotalDays, decrementTotalDays, incrementWins, decrementWins, incrementLosses, decrementLosses, getProgrammes, getOrCreateProgress } from '../../lib/database';
import { isKeepingUpWithSchedule } from '../../lib/scheduleUtils';
import { checkWeeklyReset } from '../../lib/weeklyReset';
import { createProgramme, getActiveProgramme, setActiveProgramme } from '../../lib/programmeUtils';
import type { Programme } from '../../lib/supabase';

export default function Home() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [currentProgrammeId, setCurrentProgrammeId] = useState<number>(1);
  const [activeDay, setActiveDay] = useState('day1');
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [exerciseCompletions, setExerciseCompletions] = useState<Record<string, boolean>>({});
  const [canCompleteDay, setCanCompleteDay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Ref for the CompleteDays component
  const completeDaysRef = useRef<CompleteDaysRef>(null);
  
  // Ref for the BattleProgress component
  const battleProgressRef = useRef<BattleProgressRef>(null);

  const pressPlans = {
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
          name: "Планка", 
          reps: "3 підходи по 30-45 секунд", 
          desc: "Спирайтеся на передпліччя та носки ніг. Тримайте тіло прямо, не прогинайте поперек та не піднімайте таз вгору. Напружуйте прес та сідниці.", 
          video: "https://www.youtube.com/embed/pSHjTRCQxIw" 
        }
      ],
      cooldown: { 
        name: "Заминка (5 хвилин)", 
        desc: "Приділіть увагу розтяжці м'язів живота та ніг." 
      }
    }
  };

  const fullBodyPlans = {
    day1: {
      title: 'День 1: Руки + Прес (гантелі вдома)',
      warmup: {
        name: 'Розминка (5-7 хвилин)',
        desc: "Легка кардіо-розминка + мобільність плечей та зап'ясть: оберти руками, нахили, присідання без ваги."
      },
      exercises: [
        {
          name: 'Підйом гантелей на біцепс (по черзі)',
          reps: '3 підходи по 10-12 повторень на руку',
          desc: 'Лікті притиснуті до корпусу, рух контрольований. Останні повторення мають бути важкими, але технічними.',
          video: 'https://www.youtube.com/embed/sAq_ocpRh_I'
        },
        {
          name: 'Французький жим гантелі над головою (на трицепс)',
          reps: '3 підходи по 10-12 повторень',
          desc: 'Тримайте лікті близько до голови. Опускайте гантель повільно, піднімайте без ривків.',
          video: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q'
        },
        {
          name: 'Жим гантелей лежачи на підлозі (floor press)',
          reps: '3 підходи по 8-12 повторень',
          desc: 'Лопатки зведені, лікті під кутом ~45°. Контроль вниз, потужний підйом.',
          video: 'https://www.youtube.com/embed/uUGDRwge4F8'
        },
        {
          name: 'Скручування з гантелею (на прес)',
          reps: '3 підходи по 12-15 повторень',
          desc: 'Поперек притиснутий. Піднімайте грудну клітку, не тягніть шию.',
          video: 'https://www.youtube.com/embed/wjLpKyYzZLs'
        },
        {
          name: 'Планка',
          reps: '3 підходи по 30-45 секунд',
          desc: 'Тіло рівне, прес напружений. Дихайте рівно.',
          video: 'https://www.youtube.com/embed/pSHjTRCQxIw'
        }
      ],
      cooldown: {
        name: 'Заминка (5 хвилин)',
        desc: "Легка розтяжка рук, грудних м'язів та живота."
      }
    },
    day2: {
      title: 'День 2: Ноги + Плечі + Прес',
      warmup: {
        name: 'Розминка (5-7 хвилин)',
        desc: 'Мобільність тазостегнових та плечей + 1-2 хвилини легких присідань/випадів без ваги.'
      },
      exercises: [
        {
          name: 'Присідання з гантелею (Goblet squat)',
          reps: '4 підходи по 10-12 повторень',
          desc: 'Тримайте гантель біля грудей, спина рівна. Коліна в напрямку носків.',
          video: 'https://www.youtube.com/embed/qaQPfi8f27E'
        },
        {
          name: 'Румунська тяга з гантелями (RDL)',
          reps: '3 підходи по 10-12 повторень',
          desc: 'Відводьте таз назад, спина нейтральна. Відчуйте натяг задньої поверхні стегна.',
          video: 'https://www.youtube.com/embed/MNuFYFilg_M'
        },
        {
          name: 'Жим гантелей над головою сидячи/стоячи',
          reps: '3 підходи по 8-12 повторень',
          desc: 'Не прогинайте поперек. Корпус стабільний, рух рівномірний.',
          video: 'https://www.youtube.com/embed/qEwKCR5JCog'
        },
        {
          name: 'Підйоми ніг лежачи (на нижній прес)',
          reps: '3 підходи по 10-15 повторень',
          desc: 'Поперек притиснутий. Якщо важко — зігніть коліна.',
          video: 'https://www.youtube.com/embed/JB2oyawG9KI'
        },
        {
          name: 'Бокова планка',
          reps: '2-3 підходи по 20-35 секунд на бік',
          desc: 'Тримайте таз рівно, не провалюйтеся у плечі.',
          video: 'https://www.youtube.com/embed/K2VljzCC16g'
        }
      ],
      cooldown: {
        name: 'Заминка (5 хвилин)',
        desc: 'Розтяжка стегон/сідниць + плечей.'
      }
    },
    day3: {
      title: 'День 3: Спина + Руки + Прес',
      warmup: {
        name: 'Розминка (5-7 хвилин)',
        desc: 'Легка мобільність лопаток/плечей + нахили з прямою спиною без ваги.'
      },
      exercises: [
        {
          name: 'Тяга гантелі в нахилі однією рукою',
          reps: '3 підходи по 10-12 повторень на руку',
          desc: 'Спина рівна, лопатка працює. Тягніть лікоть до тазу.',
          video: 'https://www.youtube.com/embed/roCP6wCXPqo'
        },
        {
          name: 'Підйом гантелей «молот» (hammer curls)',
          reps: '3 підходи по 10-12 повторень',
          desc: 'Нейтральний хват. Контрольний рух, без розгойдування.',
          video: 'https://www.youtube.com/embed/zC3nLlEvin4'
        },
        {
          name: 'Віджимання вузьким хватом (на трицепс)',
          reps: '3 підходи по 8-12 повторень',
          desc: 'Лікті близько до тіла. Трицепс має «горіти» наприкінці підходу.',
          video: 'https://www.youtube.com/embed/nkBQ7wVOg0Y'
        },
        {
          name: '«Велосипед» (прес)',
          reps: '3 підходи по 20-30 повторень (разом)',
          desc: 'Не тягніть шию. Скручування за рахунок преса.',
          video: 'https://www.youtube.com/embed/9FGilxCbdz8'
        },
        {
          name: 'Планка з торканням плечей',
          reps: '2-3 підходи по 20-30 торкань (разом)',
          desc: 'Таз не гойдається. Повільний контрольований темп.',
          video: 'https://www.youtube.com/embed/_L4DAzGK1GY'
        }
      ],
      cooldown: {
        name: 'Заминка (5 хвилин)',
        desc: "Розтяжка спини (поза дитини), біцепса/трицепса та живота."
      }
    }
  };

  const getActiveProgrammeName = () => {
    const p = programmes.find(pr => pr.id === currentProgrammeId);
    return p?.name || 'Прес';
  };

  const plans = getActiveProgrammeName() === 'Все тіло' ? fullBodyPlans : pressPlans;

  const getProgrammePrefix = (programmeId: number) => `p${programmeId}_`;
  const getCompletedDaysKey = (programmeId: number) => `completedDays_programme_${programmeId}`;

  // Helper function to get the next uncompleted day
  const getNextUncompletedDay = (completedDaysList: string[]) => {
    const days = ['day1', 'day2', 'day3'];
    
    // Find the first day that is not completed
    for (const day of days) {
      if (!completedDaysList.includes(day)) {
        return day;
      }
    }
    
    // If all days are completed, return day3 (last day)
    return 'day3';
  };

  // Load programmes and ensure "Все тіло" exists
  useEffect(() => {
    setMounted(true);

    const migrateLegacyLocalStorageToProgramme1 = () => {
      if (typeof window === 'undefined') return;

      // Migrate completed days
      const legacyCompleted = localStorage.getItem('completedDays');
      const programme1Key = getCompletedDaysKey(1);
      if (legacyCompleted && !localStorage.getItem(programme1Key)) {
        localStorage.setItem(programme1Key, legacyCompleted);
      }

      // Migrate exercise completion keys (day1_*, day2_*, day3_*) to p1_ prefix
      const keysToCopy: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('p')) continue; // already programme-scoped
        if (/^day(1|2|3)_(warmup|cooldown|exercise_\d+)$/.test(key)) {
          keysToCopy.push(key);
        }
      }

      keysToCopy.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value === null) return;
        localStorage.setItem(`${getProgrammePrefix(1)}${key}`, value);
      });
    };

    const initProgrammes = async () => {
      try {
        migrateLegacyLocalStorageToProgramme1();

        let list = await getProgrammes();

        // Ensure the second programme exists
        const hasFullBody = list.some(p => p.name === 'Все тіло');
        if (!hasFullBody) {
          await createProgramme('Все тіло', 'Домашня програма на все тіло з гантелями', { isActive: false });
          list = await getProgrammes();
        }

        // Ensure exactly one programme is active
        let active = list.find(p => p.is_active);
        if (!active) {
          const activeFromDb = await getActiveProgramme();
          active = activeFromDb || list.find(p => p.name === 'Прес') || list[0];
          if (active) {
            await setActiveProgramme(active.id);
            list = await getProgrammes();
          }
        }

        setProgrammes(list);
        if (active) {
          setCurrentProgrammeId(active.id);
        }

        // Ensure progress row exists for the active programme
        if (active) {
          await getOrCreateProgress(active.id);
        }
      } catch (e) {
        console.error('Error initializing programmes:', e);
      }
    };

    initProgrammes();
  }, []);

  // Load completed days from localStorage when programme changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const key = getCompletedDaysKey(currentProgrammeId);
    const saved = localStorage.getItem(key);
    const savedDays: string[] = saved ? JSON.parse(saved) : [];
    setCompletedDays(savedDays);

    checkWeeklyReset(savedDays, currentProgrammeId)
      .then((resetPerformed) => {
        if (resetPerformed) {
          setCompletedDays([]);
          localStorage.removeItem(key);
          setActiveDay('day1');
          setExerciseCompletions({});
          setResetTrigger(prev => prev + 1);

          if (battleProgressRef.current) {
            battleProgressRef.current.refreshFromDatabase();
          }
        } else {
          const nextDay = getNextUncompletedDay(savedDays);
          setActiveDay(nextDay);
        }
      })
      .catch((error) => {
        console.error('Error checking weekly reset:', error);
        const nextDay = getNextUncompletedDay(savedDays);
        setActiveDay(nextDay);
      });
  }, [mounted, currentProgrammeId]);

  // Get all exercise IDs for a day
  const getDayExerciseIds = (dayKey: string) => {
    const plan = plans[dayKey as keyof typeof plans];
    const prefix = getProgrammePrefix(currentProgrammeId);
    const ids = [
      `${prefix}${dayKey}_warmup`,
      ...plan.exercises.map((_, index) => `${prefix}${dayKey}_exercise_${index}`),
      `${prefix}${dayKey}_cooldown`
    ];
    return ids;
  };

  // Update canCompleteDay when activeDay, completedDays, or exerciseCompletions change
  useEffect(() => {
    if (!mounted) return;
    
    // Check if all exercises in the active day are completed
    const isDayCompleted = () => {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const exerciseIds = getDayExerciseIds(activeDay);
      return exerciseIds.every(id => {
        const saved = localStorage.getItem(id);
        return saved === 'true';
      });
    };
    
    const dayCompleted = isDayCompleted();
    const dayNotInCompleted = !completedDays.includes(activeDay);
    setCanCompleteDay(dayCompleted && dayNotInCompleted);
  }, [activeDay, completedDays, exerciseCompletions, mounted, getDayExerciseIds]);

  // Handle exercise completion change
  const handleExerciseCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseCompletions(prev => ({
      ...prev,
      [exerciseId]: completed
    }));
  };

  // Confetti animation function
  const triggerConfetti = () => {
    // Simple confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#007AFF', '#F75656', '#A9D2FF', '#FFD6D6']
    });
    
    // Additional burst with different timing
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#007AFF', '#F75656', '#A9D2FF', '#FFD6D6']
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#007AFF', '#F75656', '#A9D2FF', '#FFD6D6']
      });
    }, 400);
  };

  // Handle completing a day
  const handleCompleteDay = async () => {
    // Trigger confetti animation immediately when button is clicked
    triggerConfetti();
    
    const newCompletedDays = [...completedDays, activeDay];
    setCompletedDays(newCompletedDays);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(getCompletedDaysKey(currentProgrammeId), JSON.stringify(newCompletedDays));
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Check if this completes all 3 days (wins a week)
    const allDaysCompleted = newCompletedDays.length === 3;

    // Save to database
    try {
      // Get all exercise IDs for this day
      const exerciseIds = getDayExerciseIds(activeDay);
      
      // Record day completion in database
      await recordDayCompletion(activeDay, exerciseIds, currentProgrammeId);
      
      // Update weekly session with completed days
      await updateWeeklySession(newCompletedDays, currentProgrammeId);
      
      // LOGIC 1: Always increment total_days_completed for each day completed
      await incrementTotalDays(currentProgrammeId);
      
      // LOGIC 2: Only increment wins if ALL 3 days of current week are completed
      if (allDaysCompleted) {
        await incrementWins(currentProgrammeId);
        // Refresh battle progress
        if (battleProgressRef.current) {
          await battleProgressRef.current.refreshFromDatabase();
        }
      }
      
      // Refresh the counter from database to ensure accuracy
      if (completeDaysRef.current) {
        await completeDaysRef.current.refreshFromDatabase();
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

  // Handle testing - increment wins
  const handleIncrementWins = async () => {
    try {
      await incrementWins(currentProgrammeId);
      if (battleProgressRef.current) {
        await battleProgressRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error incrementing wins:', error);
    }
  };

  // Handle testing - decrement wins
  const handleDecrementWins = async () => {
    try {
      await decrementWins(currentProgrammeId);
      if (battleProgressRef.current) {
        await battleProgressRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error decrementing wins:', error);
    }
  };

  // Handle testing - increment losses
  const handleIncrementLosses = async () => {
    try {
      await incrementLosses(currentProgrammeId);
      if (battleProgressRef.current) {
        await battleProgressRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error incrementing losses:', error);
    }
  };

  // Handle testing - decrement losses
  const handleDecrementLosses = async () => {
    try {
      await decrementLosses(currentProgrammeId);
      if (battleProgressRef.current) {
        await battleProgressRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error decrementing losses:', error);
    }
  };

  // Handle testing - increment days
  const handleIncrementDays = async () => {
    try {
      await incrementTotalDays(currentProgrammeId);
      if (completeDaysRef.current) {
        await completeDaysRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error incrementing days:', error);
    }
  };

  // Handle testing - decrement days
  const handleDecrementDays = async () => {
    try {
      await decrementTotalDays(currentProgrammeId);
      if (completeDaysRef.current) {
        await completeDaysRef.current.refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error decrementing days:', error);
    }
  };

  const handleProgrammeChange = async (programmeId: number) => {
    if (programmeId === currentProgrammeId) return;

    try {
      const ok = await setActiveProgramme(programmeId);
      if (!ok) return;

      setCurrentProgrammeId(programmeId);
      // Re-fetch programmes so is_active flags are accurate
      const list = await getProgrammes();
      setProgrammes(list);

      // Ensure progress exists for the switched programme
      await getOrCreateProgress(programmeId);

      // Reset per-programme UI state
      setExerciseCompletions({});
      setResetTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Error switching programme:', e);
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

      {/* Programmes Navigation - Full Width */}
      <ProgrammesNavigation
        programmes={programmes}
        activeProgrammeId={currentProgrammeId}
        onProgrammeChange={handleProgrammeChange}
      />
      
      {/* Complete Days Tracker - Full Width */}
      <CompleteDays 
        ref={completeDaysRef} 
        programmeId={currentProgrammeId}
        onIncrement={handleIncrementDays}
        onDecrement={handleDecrementDays}
      />
      
      {/* Battle Progress - Full Width */}
      <BattleProgress 
        ref={battleProgressRef} 
        programmeId={currentProgrammeId}
        keepingUpWithSchedule={isKeepingUpWithSchedule(completedDays)}
        onIncrementWins={handleIncrementWins}
        onDecrementWins={handleDecrementWins}
        onIncrementLosses={handleIncrementLosses}
        onDecrementLosses={handleDecrementLosses}
      />
      
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
            key={`${currentProgrammeId}_${activeDay}_warmup_${resetTrigger}`}
            id={`${getProgrammePrefix(currentProgrammeId)}${activeDay}_warmup`}
            name={plans[activeDay as keyof typeof plans].warmup.name}
            desc={plans[activeDay as keyof typeof plans].warmup.desc}
            isUtility={true}
            onCompletionChange={handleExerciseCompletion}
          />

          {/* Exercises */}
          {plans[activeDay as keyof typeof plans].exercises.map((exercise, index) => (
            <ExerciseCard
              key={`${currentProgrammeId}_${activeDay}_exercise_${index}_${resetTrigger}`}
              id={`${getProgrammePrefix(currentProgrammeId)}${activeDay}_exercise_${index}`}
              name={exercise.name}
              reps={exercise.reps}
              desc={exercise.desc}
              video={exercise.video}
              onCompletionChange={handleExerciseCompletion}
            />
          ))}

          {/* Cooldown */}
          <ExerciseCard
            key={`${currentProgrammeId}_${activeDay}_cooldown_${resetTrigger}`}
            id={`${getProgrammePrefix(currentProgrammeId)}${activeDay}_cooldown`}
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
                className="font-semibold py-3 px-8 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
                style={{ 
                  backgroundColor: 'var(--blue)', 
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056CC'; // darker blue for hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--blue)';
                }}
              >
                Завершити День
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-4 text-sm text-gray-500 p-5">
          <p className="mb-3">Головне — регулярність! Навіть коротке тренування краще, ніж нічого. Успіхів!</p>
        </footer>
      </div>
    </div>
  );
}
