# Database Schema Visualization

## Entity Relationship Diagram

```
┌─────────────────────────┐
│     PROGRAMMES          │
│─────────────────────────│
│ id (PK) SERIAL          │
│ name TEXT               │
│ description TEXT        │
│ is_active BOOLEAN       │
│ created_at TIMESTAMP    │
│ updated_at TIMESTAMP    │
└─────────────────────────┘
            │
            │ 1
            │
            ├─────────────────────────┐
            │                         │
            │ *                       │ *
            ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      PROGRESS           │   │   WEEKLY_SESSIONS       │
│─────────────────────────│   │─────────────────────────│
│ id (PK) SERIAL          │   │ id (PK) UUID            │
│ programme_id (FK)       │   │ programme_id (FK)       │
│ wins INTEGER            │   │ week_start_date DATE    │
│ losses INTEGER          │   │ is_completed BOOLEAN    │
│ total_days_completed    │   │ completed_days TEXT[]   │
│ current_streak INTEGER  │   │ completed_at TIMESTAMP  │
│ longest_streak INTEGER  │   │ created_at TIMESTAMP    │
│ created_at TIMESTAMP    │   │ updated_at TIMESTAMP    │
│ updated_at TIMESTAMP    │   └─────────────────────────┘
│                         │               │
│ UNIQUE(programme_id)    │               │ 1
└─────────────────────────┘               │
                                          │ *
                                          ▼
                              ┌─────────────────────────┐
                              │   DAILY_SESSIONS        │
                              │─────────────────────────│
                              │ id (PK) UUID            │
                              │ weekly_session_id (FK)  │
                              │ day_key TEXT            │
                              │ completed_at TIMESTAMP  │
                              │ exercises_completed[]   │
                              │ total_exercises INT     │
                              │ completed_exercises INT │
                              │ created_at TIMESTAMP    │
                              └─────────────────────────┘
```

## Relationships

- **PROGRAMMES → PROGRESS**: One-to-One
  - Each programme has exactly one progress record
  - Enforced by UNIQUE constraint on programme_id

- **PROGRAMMES → WEEKLY_SESSIONS**: One-to-Many
  - Each programme can have multiple weekly sessions
  - Each week belongs to exactly one programme
  - UNIQUE constraint on (programme_id, week_start_date)

- **WEEKLY_SESSIONS → DAILY_SESSIONS**: One-to-Many
  - Each weekly session can have multiple daily sessions
  - Each daily session belongs to exactly one weekly session

## Data Flow Example

### Adding a New Programme

```
1. INSERT INTO programmes
   ↓
2. INSERT INTO progress (for new programme)
   ↓
3. User starts training
   ↓
4. INSERT INTO weekly_sessions (for current week)
   ↓
5. User completes a day
   ↓
6. INSERT INTO daily_sessions
   ↓
7. UPDATE weekly_sessions (add to completed_days)
   ↓
8. TRIGGER: update_progress() runs
   ↓
9. UPDATE progress (increment stats)
```

## Sample Data Structure

```
PROGRAMMES
┌────┬─────────┬──────────────────────────────┬───────────┐
│ id │ name    │ description                  │ is_active │
├────┼─────────┼──────────────────────────────┼───────────┤
│  1 │ Прес    │ Програма тренувань для преса │ true      │
│  2 │ Ноги    │ Програма тренувань для ніг   │ true      │
│  3 │ Руки    │ Програма тренувань для рук   │ true      │
└────┴─────────┴──────────────────────────────┴───────────┘

PROGRESS
┌────┬──────────────┬──────┬────────┬────────────────────────┐
│ id │ programme_id │ wins │ losses │ total_days_completed   │
├────┼──────────────┼──────┼────────┼────────────────────────┤
│  1 │            1 │    5 │      2 │                     15 │
│  2 │            2 │    3 │      1 │                      9 │
│  3 │            3 │    0 │      0 │                      0 │
└────┴──────────────┴──────┴────────┴────────────────────────┘

WEEKLY_SESSIONS
┌─────────┬──────────────┬─────────────────┬──────────────┬──────────────────────┐
│ id      │ programme_id │ week_start_date │ is_completed │ completed_days       │
├─────────┼──────────────┼─────────────────┼──────────────┼──────────────────────┤
│ uuid-1  │            1 │ 2025-12-16      │ false        │ ['day1']             │
│ uuid-2  │            1 │ 2025-12-09      │ true         │ ['day1','day2','day3']│
│ uuid-3  │            2 │ 2025-12-16      │ false        │ ['day1', 'day2']     │
│ uuid-4  │            2 │ 2025-12-09      │ true         │ ['day1','day2','day3']│
└─────────┴──────────────┴─────────────────┴──────────────┴──────────────────────┘
```

## Indexes for Performance

```
progress:
  - PRIMARY KEY (id)
  - INDEX (programme_id)
  - UNIQUE (programme_id)

weekly_sessions:
  - PRIMARY KEY (id)
  - INDEX (programme_id)
  - INDEX (week_start_date)
  - INDEX (programme_id, week_start_date)  ← Composite for fast queries
  - UNIQUE (programme_id, week_start_date)

daily_sessions:
  - PRIMARY KEY (id)
  - INDEX (day_key)
  - INDEX (weekly_session_id)
```

## Query Patterns

### Get Current Week for Programme
```sql
SELECT * FROM weekly_sessions
WHERE programme_id = 1
  AND week_start_date = '2025-12-16'
LIMIT 1;
```
**Performance:** Uses composite index `(programme_id, week_start_date)`

### Get Progress for Programme
```sql
SELECT * FROM progress
WHERE programme_id = 1;
```
**Performance:** Uses index on `programme_id`

### Get All Weeks for Programme
```sql
SELECT * FROM weekly_sessions
WHERE programme_id = 1
ORDER BY week_start_date DESC;
```
**Performance:** Uses index on `programme_id`

## Cascade Delete Behavior

```
DELETE FROM programmes WHERE id = 2
         │
         ├─→ DELETE FROM progress WHERE programme_id = 2
         │
         └─→ DELETE FROM weekly_sessions WHERE programme_id = 2
                    │
                    └─→ DELETE FROM daily_sessions WHERE weekly_session_id IN (...)
```

**Safety:** Default programme (id=1) cannot be deleted via application code.

## Trigger Flow

```
UPDATE weekly_sessions
SET is_completed = true
WHERE programme_id = 1

         │
         ▼
    TRIGGER: update_progress()
         │
         ▼
UPDATE progress
SET wins = wins + 1,
    total_days_completed = total_days_completed + 3
WHERE programme_id = 1
```

## Migration Impact

### Before Migration
```
progress (single row)
├── id = 1 (hardcoded)
└── No programme_id

weekly_sessions
└── UNIQUE(week_start_date)
    Only one programme could use each week!
```

### After Migration
```
progress (per programme)
├── id = auto
├── programme_id (FK to programmes)
└── UNIQUE(programme_id)
    Each programme has own progress!

weekly_sessions
└── UNIQUE(programme_id, week_start_date)
    Each programme can have same week!
```

## Backward Compatibility

All functions default to programme_id = 1:
```typescript
// Old code (still works)
await getProgress()  // programme_id = 1

// New code (explicit)
await getProgress(1)  // programme_id = 1
await getProgress(2)  // programme_id = 2
```

This ensures existing code continues to work without changes.
