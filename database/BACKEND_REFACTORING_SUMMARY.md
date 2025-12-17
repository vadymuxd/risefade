# Backend Refactoring Summary: Multi-Programme Support

## ✅ Completed Tasks

### 1. Database Schema Changes

#### Created New Migration Files:
- **[migration_add_programmes.sql](database/migration_add_programmes.sql)** - Migration script for existing databases
- **[schema_v2_programmes.sql](database/schema_v2_programmes.sql)** - Fresh schema for new installations
- **[MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)** - Comprehensive migration documentation

#### New Database Structure:
```
programmes
├── id (SERIAL PRIMARY KEY)
├── name (TEXT) - e.g., "Прес"
├── description (TEXT)
├── is_active (BOOLEAN)
├── created_at, updated_at (TIMESTAMP)

progress (updated)
├── id (SERIAL PRIMARY KEY) - now auto-incremental
├── programme_id (INTEGER FK) ← NEW
├── wins, losses, total_days_completed
├── current_streak, longest_streak
└── UNIQUE constraint on programme_id

weekly_sessions (updated)
├── id (UUID)
├── programme_id (INTEGER FK) ← NEW
├── week_start_date (DATE)
├── is_completed, completed_days
└── UNIQUE constraint on (programme_id, week_start_date)
```

### 2. TypeScript Type Updates

#### Updated [lib/supabase.ts](lib/supabase.ts):
- Added `Programme` interface
- Updated `UserProgress` interface with `programme_id`
- Updated `WeeklySession` interface with `programme_id`

### 3. Database Utility Functions

#### Updated [lib/database.ts](lib/database.ts):
All functions now support `programmeId` parameter (defaults to 1):

**Updated Functions:**
- `getProgress(programmeId?)` - Get progress for specific programme
- `getCurrentWeekSession(programmeId?)` - Get current week for specific programme
- `updateWeeklySession(completedDays, programmeId?)` - Update week for specific programme
- `recordDayCompletion(dayKey, exerciseIds, programmeId?)` - Record completion for specific programme
- `incrementTotalDays(programmeId?)`
- `decrementTotalDays(programmeId?)`
- `incrementWins(programmeId?)`
- `decrementWins(programmeId?)`
- `incrementLosses(programmeId?)`
- `decrementLosses(programmeId?)`
- `resetProgress(programmeId?)` - Reset specific programme
- `resetAllProgress()` - Reset all programmes

**New Functions:**
- `getProgrammes()` - Get all active programmes
- `getProgramme(id)` - Get specific programme
- `getOrCreateProgress(programmeId)` - Get or create progress for programme

#### Created [lib/programmeUtils.ts](lib/programmeUtils.ts):
New utility module for programme management:

**CRUD Operations:**
- `createProgramme(name, description?)` - Create new programme
- `updateProgramme(id, updates)` - Update programme details
- `deactivateProgramme(id)` - Soft delete programme
- `activateProgramme(id)` - Reactivate programme
- `deleteProgramme(id)` - Permanently delete programme (except default)

**Query Functions:**
- `getAllProgrammes(includeInactive?)` - Get all programmes
- `getProgrammeWithProgress(id)` - Get programme with its progress
- `getProgrammeStats(id)` - Get detailed statistics for programme
- `cloneProgramme(id)` - Clone existing programme

### 4. Default Data

The migration automatically:
- Creates default programme "Прес" with ID 1
- Links all existing data to Programme 1
- Creates initial progress entry for Programme 1

## 🎯 Key Features

### Multi-Programme Support
- Each programme has independent progress tracking
- Separate weekly sessions per programme
- Programme-specific wins/losses and streaks

### Backward Compatibility
- All functions default to `programmeId = 1`
- Existing code will continue to work without changes
- All existing data is preserved and linked to Programme 1

### Data Integrity
- Foreign key constraints ensure data consistency
- Cascade delete removes all related data when programme is deleted
- Unique constraints prevent duplicate weeks per programme

### Performance
- Indexed on `programme_id` for fast queries
- Composite index on `(programme_id, week_start_date)` for weekly sessions

## 📋 Migration Checklist

To apply this refactoring to your database:

1. **Backup Current Database** ⚠️
   - Export from Supabase Dashboard
   - Or use `pg_dump` command

2. **Choose Migration Path:**
   - **Existing database with data:** Run `migration_add_programmes.sql`
   - **Fresh installation:** Run `schema_v2_programmes.sql`

3. **Verify Migration:**
   ```sql
   SELECT * FROM programmes;
   SELECT * FROM progress WHERE programme_id = 1;
   SELECT id, programme_id, week_start_date FROM weekly_sessions LIMIT 5;
   ```

4. **Test in Development:**
   ```typescript
   // Test basic functions
   const programmes = await getProgrammes()
   const progress = await getProgress(1)
   const weekSession = await getCurrentWeekSession(1)
   ```

## 🔄 Next Steps: Frontend Integration

### To Implement in Frontend:

1. **Programme Selector Component**
   ```typescript
   // components/ProgrammeSelector.tsx
   - Dropdown/tabs to switch between programmes
   - Show programme name and description
   - Persist selection in localStorage or state
   ```

2. **Programme-Aware Components**
   Update these components to use selected programme:
   - `BattleProgress.tsx` - Show progress for current programme
   - `CompleteDays.tsx` - Show days for current programme
   - `WeekDay.tsx` - Track completion for current programme

3. **Programme Management UI**
   ```typescript
   // components/ProgrammeManager.tsx (optional)
   - Create new programmes
   - Edit programme details
   - View statistics for each programme
   - Deactivate/reactivate programmes
   ```

4. **State Management**
   ```typescript
   // Add to app state or context
   const [currentProgrammeId, setCurrentProgrammeId] = useState(1)
   const [programmes, setProgrammes] = useState<Programme[]>([])
   ```

### Example Frontend Implementation:

```typescript
// In your main page component
const [currentProgrammeId, setCurrentProgrammeId] = useState(1)
const [programmes, setProgrammes] = useState<Programme[]>([])
const [progress, setProgress] = useState<Progress | null>(null)

useEffect(() => {
  // Load programmes on mount
  getProgrammes().then(setProgrammes)
}, [])

useEffect(() => {
  // Load progress when programme changes
  getProgress(currentProgrammeId).then(setProgress)
}, [currentProgrammeId])

// Pass programmeId to all database functions
const handleDayComplete = async (dayKey: string) => {
  await recordDayCompletion(dayKey, exerciseIds, currentProgrammeId)
  await incrementTotalDays(currentProgrammeId)
}
```

## 📁 File Summary

### New Files Created:
1. `/database/migration_add_programmes.sql` - Migration for existing DB
2. `/database/schema_v2_programmes.sql` - Fresh schema
3. `/database/MIGRATION_GUIDE.md` - Migration documentation
4. `/lib/programmeUtils.ts` - Programme management utilities
5. `/database/BACKEND_REFACTORING_SUMMARY.md` - This file

### Modified Files:
1. `/lib/supabase.ts` - Added Programme interface, updated types
2. `/lib/database.ts` - Added programme support to all functions

## 🧪 Testing Recommendations

1. **Test Migration:**
   - Verify all existing data is preserved
   - Check that programme_id = 1 for all existing records
   - Ensure triggers still work correctly

2. **Test Multi-Programme:**
   - Create a second programme
   - Track progress independently for both programmes
   - Verify data separation between programmes

3. **Test API Functions:**
   - Test all updated functions with different programme IDs
   - Test new programme management functions
   - Test error handling for non-existent programmes

## 🚀 Ready for Frontend Development

The backend is now fully refactored and ready for frontend integration. All database operations support multiple programmes while maintaining backward compatibility with existing code.
