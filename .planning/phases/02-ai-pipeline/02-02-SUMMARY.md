---
phase: 02-ai-pipeline
plan: "02"
subsystem: api
tags: [litellm, llm, security, sandbox, exec, pandas, sqlalchemy]

requires:
  - phase: 02-ai-pipeline/02-01
    provides: Wave 0 stubs for LLMService and CodeExecutionService with skip markers

provides:
  - LiteLLM multi-model routing replacing google.generativeai in llm_service.py
  - Prompt injection protection via split system/user messages (SEC-02)
  - Hardened exec sandbox with FORBIDDEN_PATTERNS pre-scan and __builtins__ removal (SEC-01)
  - Post-exec validation rejecting empty and row-exploded DataFrames
  - FORMULA_WRITE intent type in LLM system prompt
  - intent_type column on Command SQLAlchemy model

affects: [02-03, 02-04]

tech-stack:
  added: [litellm==1.82.0, numpy (added to exec global scope)]
  patterns:
    - Split system/user messages for LLM calls — user prompt never interpolated into system string
    - FORBIDDEN_PATTERNS list scanned synchronously before exec — no subprocess or import can run
    - Post-exec row-count validation — prevents DataFrame explosion attacks

key-files:
  created: []
  modified:
    - Core/app/services/llm_service.py
    - Core/app/services/code_execution_service.py
    - Core/app/models/command.py
    - Core/tests/test_llm_service.py
    - Core/tests/test_sandbox.py

key-decisions:
  - "google.generativeai removed entirely; litellm.completion is the only LLM call path"
  - "User prompt placed in user role message only — never interpolated into system string (SEC-02)"
  - "LLM_MODEL env var controls model routing; default gemini/gemini-2.5-flash (no UI selector in v1)"
  - "FORBIDDEN_PATTERNS includes import, open(, os., sys., subprocess., __class__, __subclasses__ — pre-exec rejection"
  - "__builtins__={} in exec global_scope; pd and np are the only injected names"
  - "Post-exec validates: empty df rejected, result >10x input rows rejected"
  - "intent_type column added to Command model with default DATA_MUTATION for FORMULA_WRITE routing in 02-03"

patterns-established:
  - "LiteLLM call pattern: litellm.completion(model=os.getenv('LLM_MODEL', default), messages=[system, user])"
  - "Sandbox pattern: FORBIDDEN_PATTERNS scan → exec with __builtins__={} → post-exec row validation"

requirements-completed: [SEC-01, SEC-02, CHAT-01, CHAT-02]

duration: 6min
completed: 2026-03-08
---

# Phase 2 Plan 02: LiteLLM Migration + Exec Sandbox Hardening Summary

**LiteLLM multi-model routing with split system/user messages replaces google.generativeai; exec sandbox gains FORBIDDEN_PATTERNS pre-scan, empty builtins, and row-explosion protection**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-08T18:00:00Z
- **Completed:** 2026-03-08T18:06:12Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 5

## Accomplishments

- Replaced google.generativeai with litellm.completion; model string comes from LLM_MODEL env var (default gemini/gemini-2.5-flash)
- User prompt moved to user role message — system message contains only column/sample context and rules, eliminating prompt injection surface (SEC-02)
- Added FORMULA_WRITE intent rules to system prompt for cell formula routing (will be used in 02-03)
- Hardened exec sandbox: FORBIDDEN_PATTERNS pre-exec rejection, __builtins__={}, post-exec empty-df and row-explosion checks (SEC-01)
- Added intent_type column to Command model (String 20, default DATA_MUTATION) for FORMULA_WRITE replay routing in 02-03

## Task Commits

Each task committed atomically:

1. **Task 1: Replace Gemini SDK with LiteLLM** - `fd76401` (feat)
2. **Task 2: Harden exec sandbox + intent_type column** - `338018a` (feat)

## Files Created/Modified

- `Core/app/services/llm_service.py` — Rewritten: google.generativeai removed, litellm.completion with split messages, FORMULA_WRITE rules added
- `Core/app/services/code_execution_service.py` — FORBIDDEN_PATTERNS pre-scan, __builtins__={} global scope, numpy added, post-exec row validation
- `Core/app/models/command.py` — intent_type = Column(String(20), nullable=False, default='DATA_MUTATION') added
- `Core/tests/test_llm_service.py` — Real test bodies replacing Wave 0 stubs (2 tests)
- `Core/tests/test_sandbox.py` — Real test bodies replacing Wave 0 stubs (5 tests)

## Decisions Made

- google.generativeai removed entirely; litellm handles all LLM calls — single routing layer for multi-model support
- LLM_MODEL env var controls model; no UI selector in v1 (per CONTEXT.md decision)
- FORBIDDEN_PATTERNS pre-exec scan chosen over AST parsing — simpler, deterministic, covers the primary threat vectors
- __builtins__={} (empty dict) rather than deleting the key — exec with missing builtins can sometimes still access them via other paths

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- litellm==1.82.0 was in requirements.txt but not installed — installed via pip before GREEN phase. No code change needed.

## User Setup Required

None - no external service configuration required. GEMINI_API_KEY / other LLM keys are still read from env by litellm automatically.

## Next Phase Readiness

- llm_service.py ready for SSE endpoint wiring in 02-03
- intent_type on Command model ready for FORMULA_WRITE routing in _replay_session
- Sandbox hardened — all AI-generated code passes through SEC-01 gates before exec
- 7/7 tests green (test_sandbox.py + test_llm_service.py)

## Self-Check: PASSED

- Core/app/services/llm_service.py: FOUND
- Core/app/services/code_execution_service.py: FOUND
- Core/app/models/command.py: FOUND
- .planning/phases/02-ai-pipeline/02-02-SUMMARY.md: FOUND
- Task 1 commit fd76401: FOUND
- Task 2 commit 338018a: FOUND
- Metadata commit 91e8056: FOUND

---
*Phase: 02-ai-pipeline*
*Completed: 2026-03-08*
