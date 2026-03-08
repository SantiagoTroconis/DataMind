# Roadmap: DataMind

## Overview

DataMind is a brownfield project with an existing React + TypeScript frontend and Python Flask backend. The roadmap builds bottom-up along the architecture's own dependency layers: auth and file upload must exist before the AI pipeline can run; the AI pipeline must be hardened before state operations (undo, session resume) depend on its outputs; and the frontend integration is built last, against a stable API contract. All 20 v1 requirements are covered across 4 phases. Charts are deferred to v2 per scope decision.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, JWT middleware, API key env vars, and file upload with conversation record creation (completed 2026-03-07)
- [x] **Phase 2: AI Pipeline** - LLM integration with security hardening, cell/formula transforms via exec, multi-model via LiteLLM (completed 2026-03-08)
- [ ] **Phase 3: State Operations** - Undo, session resume, conversation history, and file TTL cleanup
- [ ] **Phase 4: Frontend Integration** - Excel preview, split layout, download button, and full UI loop

## Phase Details

### Phase 1: Foundation
**Goal**: Users can register, log in, and upload an Excel file — creating the conversation record that all subsequent operations reference
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, SEC-03, FILE-01
**Success Criteria** (what must be TRUE):
  1. A new user can register with email and password and receive a JWT
  2. A returning user can log in and stay authenticated across page reloads
  3. An authenticated user can upload a .xlsx or .xls file and receive the grid data in the response
  4. All AI API keys (Gemini, future Claude/OpenAI) are read exclusively from environment variables — never from any client-side request or codebase constant
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — pytest infrastructure (Wave 0) + backend auth fixes (register JWT, 7-day token) + DATABASE_URL env var + apiFetch utility + Register.tsx rewrite
- [ ] 01-02-PLAN.md — File upload guardrails (10 MB limit, extension whitelist, first-sheet enforcement) + full FILE-01 test suite

### Phase 2: AI Pipeline
**Goal**: Users can describe a change in natural language and have it applied to their Excel file — securely, with the AI sandbox hardened against prompt injection and arbitrary code execution
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, EDIT-03, EDIT-04, CHAT-01, CHAT-02
**Success Criteria** (what must be TRUE):
  1. A user can type "change B3 to 500" and see the cell value updated in the server-side file
  2. A user can type "add a SUM formula to column C row 10" and have the formula correctly written to the .xlsx file via openpyxl
  3. After each change, the AI returns a plain-language explanation of what it modified and why
  4. The backend accepts Claude and GPT-4 as model targets in addition to Gemini, routed via LiteLLM, with no changes required to business logic
  5. A crafted user prompt cannot escape the exec sandbox or override system instructions (exec global scope has `__builtins__` removed; user prompt passed as a separate `user` role message, not interpolated into the system instruction)
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Wave 0 test stubs (test_sandbox, test_llm_service, test_transform_sse, test_formula_write) + litellm==1.82.0 in requirements.txt
- [ ] 02-02-PLAN.md — LiteLLM replaces Gemini SDK; user prompt in separate user role message; exec sandbox hardened (__builtins__ removed, FORBIDDEN_PATTERNS, post-exec row validation); Command.intent_type column
- [ ] 02-03-PLAN.md — /excel/transform converted to SSE generator; FORMULA_WRITE intent via openpyxl; _replay_session intent routing; Dashboard.tsx fetch+ReadableStream consumer; Gunicorn gevent worker

### Phase 3: State Operations
**Goal**: Users can undo a mistake, resume a previous session, and trust that expired files are automatically cleaned up
**Depends on**: Phase 2
**Requirements**: FILE-02, AUTH-03, CHAT-03, CHAT-04, SESS-01, SESS-02
**Success Criteria** (what must be TRUE):
  1. A user can click Undo and see the last AI change reverted in both the grid data and any active charts
  2. A user can return to a previous conversation and see the full chat history and the file state at that point
  3. A user can see a list of their past conversations on the dashboard
  4. Files with expired TTLs are automatically removed from disk and their DB records cleaned up without manual intervention
  5. Chat history is visible when a user resumes a conversation — no history is lost between sessions
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — APScheduler install + test_state_ops.py (9 stubs) + /undo route extended with chart_data/has_chart/undone fields
- [ ] 03-02-PLAN.md — Verify and harden session resume tests: GET /conversations, GET /conversation/<id>, cross-user 403
- [ ] 03-03-PLAN.md — File TTL: expires_at on Conversation model + StateManager.create_session + jobs.py cleanup_expired_files + APScheduler wiring in create_app

### Phase 4: Frontend Integration
**Goal**: Users can see their Excel file rendered in a split-pane layout alongside the chat, watch changes appear in real time, and download the modified file
**Depends on**: Phase 3
**Requirements**: EDIT-01, EDIT-02, FILE-03, FILE-04
**Success Criteria** (what must be TRUE):
  1. After uploading a file, the user sees their spreadsheet rendered as a readable grid (rows, columns, values) in the browser without downloading anything
  2. The layout shows the chat panel and the Excel preview side by side simultaneously — no toggling between views
  3. After an AI change is applied, the grid updates to reflect the new values without a full page reload
  4. A clearly labeled download button appears after each AI modification, and clicking it delivers the updated .xlsx file to the user's computer
**Plans**: TBD

Plans:
- [ ] 04-01: ExcelPreview component — SheetJS 0.18.5 client-side parsing into react-data-grid; merged cell assessment
- [ ] 04-02: Split layout in Dashboard.tsx — chat panel + ExcelPreview side by side; SSE consumption from /transform; real-time grid update
- [ ] 04-03: Download button + ConversationList UI + API base URL centralized in src/utils/api.ts + token expiry interceptor

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-08 |
| 2. AI Pipeline | 3/3 | Complete   | 2026-03-08 |
| 3. State Operations | 2/3 | In Progress|  |
| 4. Frontend Integration | 0/3 | Not started | - |
