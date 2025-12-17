# Database Migration Guide: Multi-Programme Support

## Overview
This migration adds support for multiple workout programmes to the Risefade application. Previously, the app supported only a single programme. Now users can have multiple programmes, each with their own progress tracking, weekly sessions, and statistics.

## Migration Files

### 1. `migration_add_programmes.sql`
**Purpose:** Migrates existing database to support multiple programmes.

**What it does:**
- Creates a new `programmes` table
- Adds `programme_id` foreign key to `progress` and `weekly_sessions` tables
- Creates the default programme "Прес" with ID 1
- Links all existing data to Programme 1
- Updates constraints, indexes, and triggers to work with programmes
- Ensures each programme has its own progress tracking

**⚠️ Important:** Run this file ONLY if you have an existing database with data. This will preserve all your current progress and link it to Programme 1.

### 2. `schema_v2_programmes.sql`
**Purpose:** Fresh database schema with multi-programme support.

**What it does:**
- Complete schema for new installations
- Includes all tables: `programmes`, `progress`, `weekly_sessions`, `daily_sessions`
- Creates default "Прес" programme with ID 1
- Sets up all necessary indexes, triggers, and policies

**Use this:** For new installations or if you want to start fresh.

## Migration Steps

### For Existing Databases (with data to preserve)

1. **Backup your database first!**
   - Export your data from Supabase Dashboard
   - Or use `pg_dump` if you have direct access

2. **Run the migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy and paste the contents of migration_add_programmes.sql
   ```

3. **Verify the migration:**
   ```sql
   -- Check that programmes table exists
   SELECT * FROM programmes;
   
   -- Check that existing progress is linked to programme 1
   SELECT * FROM progress;
   
   -- Check that weekly_sessions have programme_id
   SELECT id, programme_id, week_start_date FROM weekly_sessions;
   ```

### For Fresh Installations

1. **Run the new schema:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy and paste the contents of schema_v2_programmes.sql
   ```

2. **Verify installation:**
   ```sql
   SELECT * FROM programmes;
   SELECT * FROM progress;
   ```

## Database Structure Changes

### New Table: `programmes`
```sql
- id (SERIAL PRIMARY KEY)
- name (TEXT) - Programme name, e.g., "Прес"
- description (TEXT) - Optional description
- is_active (BOOLEAN) - Whether programme is active
- created_at, updated_at (TIMESTAMP)
```

### Updated Table: `progress`
```sql
+ programme_id (INTEGER) - Links to programmes table
- Removed: single_row constraint (id = 1)
+ Added: unique constraint on programme_id
+ Changed: id now auto-incremental (not fixed to 1)
```

### Updated Table: `weekly_sessions`
```sql
+ programme_id (INTEGER) - Links to programmes table
~ Updated: unique constraint now (programme_id, week_start_date)
  (previously just week_start_date)
```

## API Changes in `lib/database.ts`

All functions now accept an optional `programmeId` parameter (defaults to 1 for backward compatibility):

### New Functions
```typescript
// Get all active programmes
getProgrammes(): Promise<Programme[]>

// Get specific programme
getProgramme(id: number): Promise<Programme | null>

// Get or create progress for a programme
getOrCreateProgress(programmeId?: number): Promise<Progress | null>
```

### Updated Functions (now accept programmeId)
```typescript
getProgress(programmeId?: number)
getCurrentWeekSession(programmeId?: number)
updateWeeklySession(completedDays: string[], programmeId?: number)
recordDayCompletion(dayKey: string, exerciseIds: string[], programmeId?: number)
incrementTotalDays(programmeId?: number)
decrementTotalDays(programmeId?: number)
incrementWins(programmeId?: number)
decrementWins(programmeId?: number)
incrementLosses(programmeId?: number)
decrementLosses(programmeId?: number)
resetProgress(programmeId?: number)
```

## Example Usage

### Adding a New Programme

```typescript
// In Supabase SQL Editor
INSERT INTO programmes (name, description) 
VALUES ('Ноги', 'Програма тренувань для ніг');

// In TypeScript
import { getProgrammes, getOrCreateProgress } from '@/lib/database'

const programmes = await getProgrammes()
// Now create progress for the new programme
await getOrCreateProgress(2) // assuming new programme has id 2
```

### Switching Between Programmes in Frontend

```typescript
// Store current programme ID in state
const [currentProgrammeId, setCurrentProgrammeId] = useState(1)

// Fetch progress for current programme
const progress = await getProgress(currentProgrammeId)
const weekSession = await getCurrentWeekSession(currentProgrammeId)

// Update session for current programme
await updateWeeklySession(['day1', 'day2'], currentProgrammeId)
```

## Testing the Migration

After migration, test these scenarios:

1. **Verify existing data:**
   ```typescript
   const progress = await getProgress(1)
   console.log(progress) // Should show your existing stats
   ```

2. **Create a test programme:**
   ```sql
   INSERT INTO programmes (name) VALUES ('Test Programme');
   ```

3. **Test multi-programme functionality:**
   ```typescript
   // Get all programmes
   const programmes = await getProgrammes()
   
   // Create progress for new programme
   await getOrCreateProgress(2)
   
   // Work with different programmes
   await updateWeeklySession(['day1'], 1) // Programme 1
   await updateWeeklySession(['day1'], 2) // Programme 2
   ```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- 1. Remove foreign key constraints
ALTER TABLE progress DROP CONSTRAINT fk_progress_programme;
ALTER TABLE weekly_sessions DROP CONSTRAINT fk_weekly_session_programme;

-- 2. Remove programme_id columns
ALTER TABLE progress DROP COLUMN programme_id;
ALTER TABLE weekly_sessions DROP COLUMN programme_id;

-- 3. Re-add single row constraint
ALTER TABLE progress ADD CONSTRAINT single_row CHECK (id = 1);

-- 4. Drop programmes table
DROP TABLE programmes CASCADE;

-- 5. Restore unique constraint on weekly_sessions
ALTER TABLE weekly_sessions ADD CONSTRAINT weekly_sessions_week_start_date_key 
  UNIQUE (week_start_date);
```

## Next Steps

After backend migration is complete:

1. ✅ Database migration complete
2. ✅ TypeScript types updated
3. ✅ Database utility functions updated
4. ⏳ Frontend components (to be implemented)
   - Programme selector component
   - Programme-aware progress display
   - Programme-specific weekly session view
   - Settings to manage programmes

## Notes

- Default programme ID is 1 ("Прес") for backward compatibility
- All existing data is automatically linked to Programme 1
- Each programme maintains independent progress and weekly sessions
- The trigger automatically updates programme-specific progress when weeks complete
