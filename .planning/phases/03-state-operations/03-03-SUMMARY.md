---
phase: 03-state-operations
plan: 03
subsystem: database
tags: [apscheduler, sqlalchemy, ttl, cleanup, file-management, sqlite]

# Dependency graph
requires:
  - phase: 03-state-operations/03-01
    provides: Conversation model and state_manager.create_session base
  - phase: 03-state-operations/03-02
    provides: Session resume and conversation listing routes
provides:
  - expires_at DateTime column on Conversation model (nullable, 7-day TTL from upload)
  - Core/app/jobs.py with cleanup_expired_files() (lazy imports, os.path.exists guard)
  - APScheduler BackgroundScheduler wired in create_app() with app.testing guard
  - All 3 FILE-02 TTL tests passing (0 skipped)
affects:
  - 04-excel-preview (any phase using Conversation records should account for TTL deactivation)

# Tech tracking
tech-stack:
  added: [APScheduler==3.11.2]
  patterns:
    - Lazy DB imports inside scheduled jobs to avoid circular import at module load
    - APScheduler BackgroundScheduler started only when app.testing is False
    - WERKZEUG_RUN_MAIN guard prevents double-scheduler start in dev reload mode
    - TTL_DAYS constant at module level in state_manager.py for future env-config

key-files:
  created:
    - Core/app/jobs.py
  modified:
    - Core/app/models/conversation.py
    - Core/app/services/state_manager.py
    - Core/app/__init__.py
    - Core/tests/test_state_ops.py

key-decisions:
  - "APScheduler _scheduler instantiated at module level outside create_app(); started inside only when not app.testing and WERKZEUG_RUN_MAIN guard passes"
  - "cleanup_expired_files uses lazy imports (SessionLocal, Conversation inside function body) to avoid circular imports at module load time"
  - "TTL_DAYS = 7 defined as module-level constant in state_manager.py — configurable via code without touching model"
  - "FILE-02 TTL tests use app fixture (not client) to directly control DB records without HTTP route overhead"
  - "Ghost path in test_ttl_cleanup_missing_file uses os.path.join(tempfile.gettempdir(), ...) for Windows/Linux cross-platform compatibility"

patterns-established:
  - "Scheduled job pattern: top-level os import, lazy DB/model imports inside function, try/except/finally with rollback+close"
  - "TTL test pattern: direct DB insert with fake user_id (no FK constraint in SQLite), call job directly, assert DB state"

requirements-completed: [FILE-02]

# Metrics
duration: 15min
completed: 2026-03-08
---

# Phase 3 Plan 03: File TTL Cleanup Summary

**APScheduler-backed TTL cleanup: expires_at column on Conversation, 7-day session lifetime set on upload, hourly cleanup job deactivates expired records and removes disk files**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-08T22:30:00Z
- **Completed:** 2026-03-08T22:45:00Z
- **Tasks:** 3 (2 with code changes, 1 verification gate)
- **Files modified:** 5

## Accomplishments

- Added `expires_at = Column(DateTime, nullable=True)` to Conversation model; all in-memory tests pick it up via `Base.metadata.create_all`
- `create_session` now sets `expires_at = utcnow() + 7 days` so every upload gets a TTL automatically
- Created `Core/app/jobs.py` with `cleanup_expired_files()`: filters `is_active=True AND expires_at != None AND expires_at <= now()`, guards disk deletion with `os.path.exists`, rollback on error
- APScheduler `BackgroundScheduler` wired in `create_app()` with `app.testing` guard — scheduler never starts during pytest, no double-start in Werkzeug reload
- Un-skipped all 3 FILE-02 test stubs with full implementations; all pass on first run
- Full suite: 28 passed, 0 skipped, 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Add expires_at column, create jobs.py, wire APScheduler** - `65256d2` (feat)
2. **Task 2: Un-skip FILE-02 TTL tests and make them pass** - `4cd1090` (feat)
3. **Task 3: Full suite gate** - verification only, no new commit needed

## Files Created/Modified

- `Core/app/jobs.py` - New: `cleanup_expired_files()` scheduled job with lazy DB imports and os.path.exists guard
- `Core/app/models/conversation.py` - Added `expires_at = Column(DateTime(), nullable=True)` after `created_at`
- `Core/app/services/state_manager.py` - Added `timedelta` import, `TTL_DAYS = 7` constant, `expires_at` kwarg in `create_session`
- `Core/app/__init__.py` - Added APScheduler import, `_scheduler = BackgroundScheduler()`, scheduler start block in `create_app()`
- `Core/tests/test_state_ops.py` - Replaced 3 `@pytest.mark.skip` stubs with full FILE-02 test implementations

## Decisions Made

- APScheduler `_scheduler` is module-level so it is a singleton — `replace_existing=True` prevents duplicate job registration if `create_app()` is called multiple times in edge cases
- `app.testing` evaluates to `False` at `create_app()` call time because conftest sets `TESTING=True` only after `create_app()` returns — this is intentional; scheduler correctly skips test runs
- Used `WERKZEUG_RUN_MAIN` environment variable guard (value `'true'`) to prevent the scheduler from starting twice in Werkzeug's auto-reloader (reloader forks a child process and sets this env var)
- TTL tests use `user_id=999/998/997` (fake IDs) since SQLite does not enforce FK constraints by default

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] APScheduler not installed in environment**
- **Found during:** Task 1 (before any code changes)
- **Issue:** `pip show apscheduler` returned "Package(s) not found" despite being in requirements.txt
- **Fix:** Ran `pip install APScheduler==3.11.2` to match pinned version in requirements.txt
- **Files modified:** none (environment-only fix)
- **Verification:** `from apscheduler.schedulers.background import BackgroundScheduler` imports without error
- **Committed in:** Task 1 commit 65256d2 (environment fix, not a code change)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing pip package)
**Impact on plan:** Environment-only fix, no scope creep. All planned code changes executed exactly as specified.

## Issues Encountered

None beyond the missing APScheduler package (handled as Rule 3 deviation above).

## User Setup Required

**SQLite migration required for the existing database.db on disk.** The in-memory test DB always starts fresh, but the production `Core/database.db` does NOT have the `expires_at` column until migrated.

Run one of these before starting the app:

```bash
# Option A: Add column in-place
sqlite3 Core/database.db "ALTER TABLE conversations ADD COLUMN expires_at DATETIME;"

# Option B: Delete and let SQLAlchemy recreate
rm Core/database.db
```

## Next Phase Readiness

- Phase 3 complete: all state-operation requirements (CHAT-03, SESS-01, SESS-02, AUTH-03, FILE-02) are implemented and tested
- Phase 4 (excel-preview) can proceed; any code touching Conversation records should be aware that `is_active=False` now includes TTL-expired records in addition to manually deleted ones
- The scheduler runs hourly in production — no additional ops configuration needed

---
*Phase: 03-state-operations*
*Completed: 2026-03-08*

## Self-Check: PASSED

- Core/app/jobs.py: FOUND
- Core/app/models/conversation.py: FOUND (expires_at column added)
- Core/app/services/state_manager.py: FOUND (TTL_DAYS + expires_at in create_session)
- Core/app/__init__.py: FOUND (APScheduler wired)
- Core/tests/test_state_ops.py: FOUND (3 FILE-02 tests un-skipped and passing)
- .planning/phases/03-state-operations/03-03-SUMMARY.md: FOUND
- Commit 65256d2: FOUND (Task 1 — production code)
- Commit 4cd1090: FOUND (Task 2 — TTL tests)
