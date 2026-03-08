---
phase: 02-ai-pipeline
plan: 01
subsystem: testing
tags: [litellm, pytest, tdd, sandbox, sse, llm]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Flask app, conftest.py client fixture, CodeExecutionService, LLMService stubs
provides:
  - Wave 0 skip-stub test contract for all Phase 2 behaviors (10 tests)
  - litellm==1.82.0 pinned in requirements.txt
  - TestSandbox class (5 stubs: SEC-01, SEC-02)
  - TestLLMService class (2 stubs: CHAT-01, SEC-02 prompt separation)
  - SSE transform endpoint stubs (2: EDIT-03, CHAT-02)
  - Formula write disk stub (1: EDIT-04)
affects: [02-02, 02-03]

# Tech tracking
tech-stack:
  added: [litellm==1.82.0]
  patterns: [Wave 0 Nyquist stub pattern — all stubs skip-decorated; services imported at module level to surface import errors immediately]

key-files:
  created:
    - Core/tests/test_sandbox.py
    - Core/tests/test_llm_service.py
    - Core/tests/test_transform_sse.py
    - Core/tests/test_formula_write.py
  modified:
    - Core/requirements.txt

key-decisions:
  - "Wave 0 stubs use @pytest.mark.skip (not xfail) — stubs are known-missing, not expected-to-fail"
  - "CodeExecutionService and LLMService imported at module level with ImportError guard so collection never errors even before services exist"
  - "test_transform_sse.py and test_formula_write.py use module-level functions accepting client fixture — consistent with conftest.py fixture scope"

patterns-established:
  - "Wave 0 stub pattern: import service at top with try/except ImportError guard, mark all test methods @pytest.mark.skip with reason indicating which plan implements them"
  - "Phase 2 test split: sandbox/llm tests in classes (unit-style), SSE/formula tests as module functions (integration-style with client fixture)"

requirements-completed: [SEC-01, SEC-02, CHAT-01]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 2 Plan 01: Wave 0 Test Stubs Summary

**10 pytest skip-stubs establishing the Phase 2 test contract: sandbox hardening, litellm routing, SSE transform, and formula write — with litellm==1.82.0 pinned in requirements.txt**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T06:32:28Z
- **Completed:** 2026-03-08T06:40:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added litellm==1.82.0 to Core/requirements.txt (preserving UTF-16 encoding)
- Created 4 Wave 0 stub test files totaling 10 skip-decorated tests with zero collection errors
- Established Nyquist-compliant test contract: plans 02-02 and 02-03 have clear failing targets

## Task Commits

Each task was committed atomically:

1. **Task 1: Add litellm to requirements.txt** - `0b8ef81` (feat)
2. **Task 2: Create Wave 0 test stubs** - `6b540a0` (test)

## Files Created/Modified

- `Core/requirements.txt` - Added litellm==1.82.0 (UTF-16 encoding preserved)
- `Core/tests/test_sandbox.py` - 5 stubs for SEC-01/SEC-02 sandbox hardening (TestSandbox class)
- `Core/tests/test_llm_service.py` - 2 stubs for CHAT-01/SEC-02 litellm routing (TestLLMService class)
- `Core/tests/test_transform_sse.py` - 2 stubs for EDIT-03/CHAT-02 SSE transform endpoint integration
- `Core/tests/test_formula_write.py` - 1 stub for EDIT-04 formula write to disk

## Decisions Made

- Used `@pytest.mark.skip` (not `xfail`) for all stubs — these are known-unimplemented, not expected failures
- Services imported at module level with `try/except ImportError` guard so pytest collection never errors even before plan 02-02 implements the hardened services
- Module-level functions (not class methods) for SSE and formula write tests to match conftest.py `client` fixture injection pattern

## Deviations from Plan

None — plan executed exactly as written. The UTF-16 encoding of requirements.txt was handled transparently via Python's `open(..., encoding='utf-16')` without altering the file format.

## Issues Encountered

- requirements.txt is UTF-16 encoded (BOM: `fffe`). Modified via Python to preserve encoding. The Read tool displayed wide characters, but the underlying content was intact. No impact on plan execution.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02-02 (sandbox hardening + litellm refactor) has clear red targets: 7 skipped tests in TestSandbox and TestLLMService
- Plan 02-03 (SSE transform endpoint) has 3 skipped integration targets
- litellm is pinned and ready to install

---
*Phase: 02-ai-pipeline*
*Completed: 2026-03-08*
