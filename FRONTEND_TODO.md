# Frontend Implementation Checklist

## 📋 Tasks to Complete Frontend Integration

### Phase 1: Basic Programme Support (Essential)

#### 1. Update page.tsx to Support Current Programme
- [ ] Add state for `currentProgrammeId` (default: 1)
- [ ] Add state for `programmes` list
- [ ] Load programmes on component mount
- [ ] Pass `currentProgrammeId` to all database function calls

**Example changes needed in page.tsx:**
```typescript
// Add these states
const [currentProgrammeId, setCurrentProgrammeId] = useState(1)
const [programmes, setProgrammes] = useState<Programme[]>([])

// Load programmes on mount
useEffect(() => {
  getProgrammes().then(setProgrammes)
}, [])

// Update existing database calls
recordDayCompletion(dayKey, exerciseIds, currentProgrammeId)  // Add 3rd param
incrementTotalDays(currentProgrammeId)  // Add param
updateWeeklySession(completedDays, currentProgrammeId)  // Add 2nd param
// etc...
```

#### 2. Update CompleteDays Component
- [ ] Accept `programmeId` prop
- [ ] Pass `programmeId` to `getCurrentWeekSession()`
- [ ] Pass `programmeId` to `updateWeeklySession()`

**File:** [src/components/CompleteDays.tsx](../src/components/CompleteDays.tsx)

#### 3. Update BattleProgress Component
- [ ] Accept `programmeId` prop
- [ ] Pass `programmeId` to `getProgress()`

**File:** [src/components/BattleProgress.tsx](../src/components/BattleProgress.tsx)

#### 4. Update WeekDay Component (if needed)
- [ ] Check if it calls any database functions
- [ ] If yes, add `programmeId` parameter

**File:** [src/components/WeekDay.tsx](../src/components/WeekDay.tsx)

---

### Phase 2: Programme Selector UI (Important)

#### 5. Create ProgrammeSelector Component
- [ ] Create component at `src/components/ProgrammeSelector.tsx`
- [ ] Display dropdown/tabs of available programmes
- [ ] Show current programme name prominently
- [ ] Handle programme switching
- [ ] Persist selection to localStorage

**Component structure:**
```typescript
interface Props {
  programmes: Programme[]
  currentId: number
  onSwitch: (id: number) => void
}

export default function ProgrammeSelector({ programmes, currentId, onSwitch }: Props) {
  return (
    <div className="programme-selector">
      <select value={currentId} onChange={(e) => onSwitch(Number(e.target.value))}>
        {programmes.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
```

#### 6. Add ProgrammeSelector to Main Page
- [ ] Import ProgrammeSelector component
- [ ] Add it to the UI (top of page recommended)
- [ ] Connect to state
- [ ] Reload data when programme changes

**Add to page.tsx:**
```typescript
// Handle programme switch
const handleProgrammeSwitch = (newId: number) => {
  setCurrentProgrammeId(newId)
  localStorage.setItem('currentProgrammeId', String(newId))
  // Force reload of data
  setResetTrigger(prev => prev + 1)
}

// In JSX
<ProgrammeSelector 
  programmes={programmes}
  currentId={currentProgrammeId}
  onSwitch={handleProgrammeSwitch}
/>
```

---

### Phase 3: Data Persistence (Critical)

#### 7. Persist Programme Selection
- [ ] Save `currentProgrammeId` to localStorage on change
- [ ] Load `currentProgrammeId` from localStorage on mount
- [ ] Handle case where stored programme no longer exists

```typescript
useEffect(() => {
  const saved = localStorage.getItem('currentProgrammeId')
  if (saved) {
    const id = Number(saved)
    // Verify programme exists
    getProgrammes().then(progs => {
      if (progs.some(p => p.id === id)) {
        setCurrentProgrammeId(id)
      }
    })
  }
}, [])
```

#### 8. Handle Data Reloading on Programme Change
- [ ] Create effect to reload data when `currentProgrammeId` changes
- [ ] Clear existing state before loading new programme data
- [ ] Show loading state during transition

```typescript
useEffect(() => {
  // Clear and reload when programme changes
  setCompletedDays([])
  setExerciseCompletions({})
  
  // Trigger refs to reload
  completeDaysRef.current?.loadData()
  battleProgressRef.current?.loadData()
}, [currentProgrammeId])
```

---

### Phase 4: Programme Management (Optional but Recommended)

#### 9. Create ProgrammeManager Component
- [ ] Create component at `src/components/ProgrammeManager.tsx`
- [ ] Add button to create new programme
- [ ] Show list of all programmes
- [ ] Edit programme name/description
- [ ] Deactivate/reactivate programmes
- [ ] View stats for each programme

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Programme Management                │
├─────────────────────────────────────┤
│ [+ Create New Programme]            │
│                                     │
│ Прес                 [Edit] [Stats]│
│ Ноги                 [Edit] [Stats]│
│ Руки                 [Edit] [Stats]│
└─────────────────────────────────────┘
```

#### 10. Add Programme Stats Modal/Page
- [ ] Show detailed statistics for selected programme
- [ ] Display: wins, losses, total days, streaks
- [ ] Show completion rate
- [ ] Show history of weekly sessions

```typescript
import { getProgrammeStats } from '@/lib/programmeUtils'

const stats = await getProgrammeStats(programmeId)
// Display: stats.progress, stats.completionRate, etc.
```

---

### Phase 5: Polish & UX (Nice to Have)

#### 11. Programme Indicator
- [ ] Show current programme name in header/navbar
- [ ] Visual distinction for different programmes (colors/icons)
- [ ] Smooth transitions when switching programmes

#### 12. First-Time User Experience
- [ ] Show tutorial/tooltip about programmes
- [ ] Explain that data is separate per programme
- [ ] Guide user through creating their first custom programme

#### 13. Programme Templates
- [ ] Create preset programme templates
- [ ] "Quick start" button to create common programmes
- [ ] Example: "Прес", "Ноги", "Руки", "Кардіо"

---

## 🗂️ Files That Need Changes

### Must Edit:
- ✅ **lib/database.ts** - Already updated
- ✅ **lib/supabase.ts** - Already updated
- ⏳ **src/app/page.tsx** - Main page component
- ⏳ **src/components/CompleteDays.tsx** - Weekly progress
- ⏳ **src/components/BattleProgress.tsx** - Win/loss tracking

### Should Create:
- ⏳ **src/components/ProgrammeSelector.tsx** - Programme switcher
- ⏳ **src/components/ProgrammeManager.tsx** - Programme CRUD (optional)

### Optional:
- **src/contexts/ProgrammeContext.tsx** - Global state management
- **src/app/programmes/page.tsx** - Dedicated programmes page
- **src/components/ProgrammeStats.tsx** - Statistics view

---

## 🧪 Testing Checklist

After implementation, test:

### Basic Functionality:
- [ ] Can see default programme "Прес"
- [ ] Can complete exercises for programme 1
- [ ] Progress is tracked correctly for programme 1
- [ ] Weekly reset works for programme 1

### Multi-Programme:
- [ ] Can create new programme
- [ ] Can switch between programmes
- [ ] Each programme has independent progress
- [ ] Completing day in Programme 1 doesn't affect Programme 2
- [ ] Weekly sessions are separate per programme

### Edge Cases:
- [ ] Switching programmes mid-day doesn't break state
- [ ] Refreshing page maintains selected programme
- [ ] Deleting programme doesn't break app (if implemented)
- [ ] Can have same week active for multiple programmes

---

## 📊 Estimated Effort

| Phase | Complexity | Time Estimate |
|-------|-----------|---------------|
| Phase 1: Basic Support | Medium | 1-2 hours |
| Phase 2: Programme Selector | Easy | 30-60 min |
| Phase 3: Data Persistence | Easy | 30 min |
| Phase 4: Programme Management | Medium | 2-3 hours |
| Phase 5: Polish & UX | Low | 1-2 hours |
| **Total** | | **5-9 hours** |

---

## 🚀 Quick Start Implementation Order

**Recommended order for fastest MVP:**

1. **First:** Phase 1, Task 1-4 (Basic programme support) - Get it working
2. **Second:** Phase 2, Task 5-6 (Programme selector) - Make it usable
3. **Third:** Phase 3, Task 7-8 (Persistence) - Make it persistent
4. **Later:** Phase 4 & 5 (Management & Polish) - Make it complete

**Minimum Viable Implementation:**
- Update page.tsx with currentProgrammeId state
- Pass programmeId to all database calls
- Add simple dropdown to switch programmes
- Done! Rest can be added incrementally.

---

## 💡 Pro Tips

1. **Test with Database First:** Before touching frontend, create Programme 2 manually in Supabase and test backend functions
2. **Incremental Changes:** Don't change everything at once. Start with page.tsx only
3. **Use Default Values:** Keep programmeId=1 as default everywhere for safety
4. **Console Logging:** Add logs when switching programmes to verify data is loading correctly
5. **Backup:** Keep a copy of page.tsx before making changes

---

## 📞 Need Help?

If you get stuck on any step:
1. Check the API_REFERENCE.md for usage examples
2. Look at MIGRATION_GUIDE.md for database structure
3. Review SCHEMA_DIAGRAM.md to understand relationships
4. Test backend functions in isolation first (without UI changes)

---

**Backend Status:** ✅ Complete and ready  
**Frontend Status:** ⏳ Ready to implement

Once you complete Phase 1-3, you'll have a fully functional multi-programme system!
