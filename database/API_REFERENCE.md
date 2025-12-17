# Quick Reference: Multi-Programme API

## Import Functions

```typescript
// Programme queries
import { getProgrammes, getProgramme } from '@/lib/database'

// Progress queries (programme-aware)
import { 
  getProgress, 
  getOrCreateProgress,
  getCurrentWeekSession,
  updateWeeklySession,
  recordDayCompletion 
} from '@/lib/database'

// Programme management
import { 
  createProgramme, 
  updateProgramme,
  deactivateProgramme,
  getProgrammeStats,
  getAllProgrammes 
} from '@/lib/programmeUtils'
```

## Common Usage Patterns

### 1. Get All Programmes
```typescript
const programmes = await getProgrammes()
// Returns: Programme[] (only active programmes)

// Example result:
// [
//   { id: 1, name: 'Прес', description: 'Програма тренувань для преса', is_active: true },
//   { id: 2, name: 'Ноги', description: 'Програма тренувань для ніг', is_active: true }
// ]
```

### 2. Get Progress for Specific Programme
```typescript
// Get progress for programme 1 (default)
const progress = await getProgress(1)

// Get progress for programme 2
const progress2 = await getProgress(2)

// Example result:
// {
//   id: 1,
//   programme_id: 1,
//   wins: 5,
//   losses: 2,
//   total_days_completed: 15,
//   current_streak: 3,
//   longest_streak: 7
// }
```

### 3. Create New Programme
```typescript
const newProgramme = await createProgramme(
  'Ноги',
  'Програма тренувань для ніг'
)
// Automatically creates initial progress entry with zeros
```

### 4. Switch Programme in UI
```typescript
// In your component
const [currentProgrammeId, setCurrentProgrammeId] = useState(1)

// Update when user selects different programme
const handleProgrammeChange = (newId: number) => {
  setCurrentProgrammeId(newId)
  // Reload data for new programme
  loadProgrammeData(newId)
}

const loadProgrammeData = async (programmeId: number) => {
  const progress = await getProgress(programmeId)
  const weekSession = await getCurrentWeekSession(programmeId)
  // Update your state...
}
```

### 5. Track Day Completion for Programme
```typescript
// Complete a day for programme 1
await recordDayCompletion('day1', ['ex1', 'ex2', 'ex3'], 1)
await incrementTotalDays(1)

// Update weekly session
const currentSession = await getCurrentWeekSession(1)
const completedDays = [...(currentSession?.completed_days || []), 'day1']
await updateWeeklySession(completedDays, 1)
```

### 6. Get Programme Statistics
```typescript
const stats = await getProgrammeStats(1)

// Returns:
// {
//   progress: { wins: 5, losses: 2, ... },
//   totalWeeks: 10,
//   completedWeeks: 5,
//   currentWeek: { ... },
//   completionRate: 50
// }
```

### 7. Manage Programmes
```typescript
// Update programme
await updateProgramme(2, { 
  name: 'Ноги PRO',
  description: 'Розширена програма' 
})

// Deactivate programme (soft delete)
await deactivateProgramme(2)

// Reactivate
await activateProgramme(2)

// Clone programme
const cloned = await cloneProgramme(1)
// Creates "Прес (Копія)"
```

## Frontend Integration Pattern

### App-wide State (recommended)
```typescript
// In your main App/Layout component
import { createContext, useContext, useState, useEffect } from 'react'

const ProgrammeContext = createContext<{
  currentProgrammeId: number
  programmes: Programme[]
  switchProgramme: (id: number) => void
}>({
  currentProgrammeId: 1,
  programmes: [],
  switchProgramme: () => {}
})

export function ProgrammeProvider({ children }) {
  const [currentProgrammeId, setCurrentProgrammeId] = useState(1)
  const [programmes, setProgrammes] = useState<Programme[]>([])

  useEffect(() => {
    // Load programmes on mount
    getProgrammes().then(setProgrammes)
    
    // Load from localStorage if available
    const saved = localStorage.getItem('currentProgrammeId')
    if (saved) setCurrentProgrammeId(Number(saved))
  }, [])

  const switchProgramme = (id: number) => {
    setCurrentProgrammeId(id)
    localStorage.setItem('currentProgrammeId', String(id))
  }

  return (
    <ProgrammeContext.Provider value={{ 
      currentProgrammeId, 
      programmes, 
      switchProgramme 
    }}>
      {children}
    </ProgrammeContext.Provider>
  )
}

export const useProgramme = () => useContext(ProgrammeContext)
```

### Use in Components
```typescript
// In any component
import { useProgramme } from '@/contexts/ProgrammeContext'

export function MyComponent() {
  const { currentProgrammeId, programmes, switchProgramme } = useProgramme()
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    // Reload when programme changes
    getProgress(currentProgrammeId).then(setProgress)
  }, [currentProgrammeId])

  return (
    <div>
      {/* Programme selector */}
      <select 
        value={currentProgrammeId} 
        onChange={(e) => switchProgramme(Number(e.target.value))}
      >
        {programmes.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Show progress for current programme */}
      {progress && (
        <div>
          <p>Wins: {progress.wins}</p>
          <p>Days: {progress.total_days_completed}</p>
        </div>
      )}
    </div>
  )
}
```

## Database Migration Commands

### For Existing Database (Supabase SQL Editor):
```sql
-- Copy and paste entire content of migration_add_programmes.sql
-- This preserves all existing data and links it to Programme 1
```

### Verify Migration:
```sql
-- Check programmes
SELECT * FROM programmes;

-- Check existing data is linked
SELECT id, programme_id, wins, total_days_completed FROM progress;
SELECT id, programme_id, week_start_date FROM weekly_sessions LIMIT 5;
```

### Add New Programme:
```sql
INSERT INTO programmes (name, description) 
VALUES ('Ноги', 'Програма тренувань для ніг');

-- Create progress for it
INSERT INTO progress (programme_id) VALUES (2);
```

## Default Behavior

All functions default to `programmeId = 1` if not specified:

```typescript
// These are equivalent:
await getProgress()
await getProgress(1)

// These are equivalent:
await getCurrentWeekSession()
await getCurrentWeekSession(1)
```

This ensures backward compatibility with existing code.

## Type Definitions

```typescript
interface Programme {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Progress {
  id: number
  programme_id: number
  wins: number
  losses: number
  total_days_completed: number
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

interface WeeklySession {
  id: string
  programme_id: number
  week_start_date: string
  is_completed: boolean
  completed_days: string[]
  completed_at?: string
  created_at: string
  updated_at: string
}
```
