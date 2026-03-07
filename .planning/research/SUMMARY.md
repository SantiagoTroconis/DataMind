# Project Research Summary

**Project:** DataMind — AI-powered Excel editor
**Domain:** Natural language to spreadsheet transformation, browser-based, standalone web app
**Researched:** 2026-03-06
**Confidence:** MEDIUM (architecture from live codebase analysis at HIGH; stack and features limited by unavailable web search)

## Executive Summary

DataMind is a brownfield React + TypeScript + Python Flask application that lets users upload an Excel file, describe changes in natural language, and receive an updated file. The product occupies a real market gap: competitors either handle Q&A only (ChatCSV), require Microsoft 365 (Excel Copilot), or are English-first (Julius AI). The recommended approach is to extend what already exists rather than rebuild. The core architecture — event-sourcing via a Command log, LLM-generated Python executed in a sandboxed `exec()`, and a split-pane chat + preview UI — is sound and should be preserved. The primary changes needed are: replacing the single-provider Gemini SDK with LiteLLM for multi-model routing, adding SSE for streaming AI responses, and implementing file TTL cleanup with APScheduler. All existing dependencies (openpyxl, SheetJS 0.18.5, react-data-grid, pandas) are correct choices that should be kept for v1.

The most dangerous existing issues are security-level problems, not feature gaps. The `exec()` sandbox is incomplete — `__builtins__` is not removed from the execution scope, meaning any authenticated user can compromise the server through a crafted prompt. The user's raw prompt string is interpolated directly into the LLM system instruction, enabling prompt injection. File storage has no TTL and deleted conversations do not remove files from disk. These are not "polish later" issues — they must be resolved before any public deployment. All three originate from the current codebase and are confirmed by direct code analysis, not speculation.

The recommended roadmap follows the architecture's own dependency layers: foundation (auth, DB models, file upload) must precede the AI pipeline, which must precede state operations (undo, session resume), which must precede the full frontend integration. The biggest implementation risk is not the AI integration itself — that is well-understood — but the spreadsheet preview renderer, which must handle merged cells, frozen panes, and chart objects in a way that simple data grids do not support out of the box. Plan for this component to take longer than expected.

---

## Key Findings

### Recommended Stack

The existing stack is well-chosen and requires additions, not replacements. openpyxl 3.1.5 (already installed) is the correct Python library for `.xlsx` read/write — it is the only pure-Python option that handles formula strings, named ranges, and chart definitions without requiring a running Excel instance. SheetJS 0.18.5 (already installed) must remain version-pinned at exactly 0.18.5, as subsequent versions moved to a commercial license. The primary gaps are: no multi-model AI routing, no streaming, and no file cleanup scheduler.

**Core technologies:**
- **openpyxl 3.1.5** (already installed): Excel file I/O including formula strings and chart definitions — extend usage beyond current pandas-only path
- **pandas 2.3.3** (already installed): DataFrame manipulation for data transforms — keep as-is
- **SheetJS 0.18.5** (already installed): Client-side `.xlsx` parsing for browser preview — do NOT upgrade past 0.18.5 (license change)
- **react-data-grid 7.0.0-beta.47** (already installed): Grid display component for v1 — sufficient for read-only preview; defer fortune-sheet to v2 if in-browser formula evaluation is required
- **LiteLLM** (to add): Unified API layer over Gemini, Claude, OpenAI, Mistral — replaces the current single-provider Gemini SDK; one-line model switching
- **APScheduler ~3.10.x** (to add): Background job for file TTL cleanup — runs inside Flask process, no new infrastructure
- **SSE via Flask `stream_with_context`**: Token-by-token AI streaming — matches the unidirectional server-push use case exactly; WebSockets are overkill for this pattern

For v2+: consider migrating the `/transform` route to FastAPI for cleaner async streaming, and adopting S3-compatible object storage to survive container restarts.

### Expected Features

The competitive analysis shows most tools do one thing well (Q&A, or formula generation, or chart creation) but none deliver the complete loop — upload, chat, live preview, download — as a standalone web app at sub-$50/month targeting non-technical users. DataMind's unique position combines that full loop with Spanish-first UX for the Latin American market, where no major competitor offers a native experience.

**Must have (table stakes for v1):**
- File upload (.xlsx / .xls) with drag-and-drop — entry point to the product
- Spreadsheet preview render (read-only, tabular) — users must see data to trust the tool
- Split layout: chat left, sheet right — all competitors use this; users arrive expecting it
- Real-time preview update after each AI change — not "download to check"
- Cell value edits via natural language — most basic mutation
- Formula creation (SUM, VLOOKUP, IF, AVERAGE as priority formulas) — most-requested capability
- Basic chart creation (bar, line, pie) — second most-requested capability
- Download modified .xlsx — the deliverable; user's entire goal
- Session persistence with conversation history — multi-step work requires this
- Error feedback in chat when AI cannot fulfill a request — silence is confusing
- Authentication (register, login, JWT) — gates all session persistence
- Spanish-first UI and system prompts — zero extra cost, high market value

**Should have (competitive differentiators, add after core loop validates):**
- Formula explanation mode ("what does this formula do?") — high value, low implementation cost
- Undo last change — users will ask immediately after first mistake
- Multi-step conversational context ("now make that chart a pie chart") — requires full history in LLM context
- Named range and table awareness — improves AI accuracy on structured files

**Defer to v2+:**
- Cell formatting (colors, borders, conditional formatting)
- Real-time collaboration
- Google Sheets integration
- Export to PDF
- CSV import (acceptable v1.x addition if upload rejection causes friction)
- Pivot tables (hard constraint: openpyxl cannot create real Excel pivot tables — do not promise this feature)

**Anti-features (deliberately not building):**
- Direct cell editing in the preview (click-to-type) — undermines the AI-first differentiator
- Formula bar — if we add it, we are building Excel lite, not an AI editor
- Macro/VBA generation — security risk; openpyxl has no VBA round-trip support

### Architecture Approach

The existing architecture uses an event-sourcing Command log: the original uploaded file is immutable, and all transformations are stored as executable Python code in `Command` records. Current state is derived by replaying all active commands against the original file. This is the correct pattern — it gives undo for free, enables session resume after server restart, and prevents data corruption from failed mid-session writes. The pattern must be preserved and not bypassed. `Dashboard.tsx` is the single frontend state owner; all child components receive data via props and emit intents via callbacks. The backend enforces strict layer boundaries: routes handle only auth and input validation, services hold all logic, and only `LLMService` calls AI APIs and only `CodeExecutionService` calls `exec()`.

**Major components:**
1. **`Dashboard.tsx`** — root state owner; orchestrates all API calls; holds `gridData`, `chartData`, `messages[]`, `sessionId`
2. **`LLMService`** — intent classification (`DATA_MUTATION` / `VISUAL_UPDATE`) + Python code generation via AI API; must be refactored to adapter pattern for multi-model support
3. **`CodeExecutionService`** — sandboxed `exec()` of LLM-generated code; the critical security boundary; only component that may call `exec()`
4. **`ExcelService`** — disk-based file I/O; DataFrame serialization to `{ columns, rows }` JSON; must be extended to use openpyxl directly for formula and chart writes
5. **`StateManager`** — all DB access for `Conversation` and `Command` records; implements `_replay_session()`
6. **`ExcelPreview`** (to build) — read-only spreadsheet grid rendered from `{ columns, rows }`; the hardest frontend component given merged cells and chart requirements

### Critical Pitfalls

1. **Unsandboxed `exec()` allows full server compromise** — `__builtins__` is never removed from the `exec()` global scope; any authenticated user can run arbitrary OS commands via a crafted prompt. Fix immediately: `global_scope = {'__builtins__': {}, 'pd': pd}`. For production: subprocess isolation with resource limits. This must be resolved before any public deployment.

2. **Prompt injection via f-string interpolation** — user's raw prompt is embedded directly into the LLM system instruction as a string. An attacker can inject new instructions that override system rules and cause the AI to generate destructive code, which is then stored and replayed. Fix: pass the user prompt as a separate `user` message role, not inline in the system instruction; validate generated code output for forbidden builtins before storage; enforce `len(prompt) <= 1000` server-side.

3. **Full Command replay on every request becomes a performance wall** — `_replay_session()` re-executes every stored command on every `/transform`, `/undo`, and `/reset` call. At 20+ commands on files with thousands of rows, responses will time out. Fix: cache the materialized DataFrame state per conversation in Redis (keyed by `conversation_id + command_count`). Design the caching layer before adding undo and session persistence features, as each adds replay depth.

4. **File storage accumulates without TTL; container restarts destroy active sessions** — `delete_conversation` does not call `os.remove()`; there is no `expires_at` column on `Conversation`; no scheduled cleanup job exists. Files stored in the container filesystem are destroyed on container restart. Fix: add `expires_at` to `Conversation`, implement APScheduler cleanup job calling `os.remove()`, and plan S3-compatible object storage for any containerized deployment.

5. **DataFrame corruption by LLM is stored silently** — `CodeExecutionService` validates only that the result is a `pd.DataFrame`, not that it is reasonable (row count unchanged, columns not dropped, values not all-constant). A bad LLM response can wipe data and get stored in the Command log, corrupting every subsequent replay. Fix: post-execution validation comparing result shape, column names, and row count against the pre-transformation snapshot; warn if row count drops >80%; reject if zero columns.

---

## Implications for Roadmap

Based on combined research, the architecture's own dependency layers map directly to roadmap phases. Build bottom-up: no AI feature can be shipped without auth and file upload; no undo can work without the Command model; no frontend integration is useful without backend endpoints.

### Phase 1: Foundation — Auth, DB Models, File Upload

**Rationale:** Auth is a hard gate — all Excel endpoints require JWT. The `Conversation` and `Command` DB models underpin every subsequent feature. File upload creates the `Conversation` record that all other operations reference. Nothing else can be built or tested without these three.

**Delivers:** User registration and login; JWT middleware on all protected routes; file upload to disk; initial grid data returned to frontend; `Conversation` record created with `expires_at` for TTL; `StateManager` and `_replay_session()` established as the single state derivation path.

**Addresses:** Authentication, file upload, session persistence (table stakes from FEATURES.md)

**Avoids:** File storage accumulation pitfall — design `expires_at` into the `Conversation` model from the first migration, not as a retrofit; hardcoded credentials pitfall — enforce env vars from the first commit; filesystem session storage pitfall — audit Flask-Session usage and remove or replace with Redis before it reaches production.

**Research flag:** Standard patterns — JWT auth, SQLAlchemy models, Flask file upload are all well-documented. No phase research needed.

---

### Phase 2: Core AI Pipeline — LLM Integration, Code Execution, Transform Endpoint

**Rationale:** The AI pipeline is the product's core differentiator. It must be built and hardened before any frontend feature depends on it. Security hardening of `exec()` and prompt injection prevention belong in this phase, not as a later retrofit.

**Delivers:** LiteLLM integration replacing the single-provider Gemini SDK; refactored `LLMService` with adapter interface (Gemini adapter as reference, Claude/OpenAI stubs); SSE streaming response from `/excel/transform`; `exec()` sandbox hardened with `__builtins__` removed; post-execution DataFrame validation; prompt length enforcement; generated code output validation for forbidden patterns; `/excel/transform` endpoint fully operational.

**Uses:** LiteLLM (new), SSE via Flask `stream_with_context`, openpyxl extended for formula and chart writes (STACK.md)

**Implements:** LLMService adapter pattern, CodeExecutionService security boundary, ExcelService formula/chart write path (ARCHITECTURE.md)

**Avoids:** Unsandboxed `exec()` pitfall; prompt injection pitfall; DataFrame corruption pitfall — all three must be addressed before this phase closes, not after.

**Research flag:** SSE and LiteLLM integration are standard patterns with good documentation — no phase research needed. openpyxl chart API for programmatic chart creation from AI output is worth a targeted research pass: it is the most complex backend operation and the library's chart API has non-obvious type mapping requirements.

---

### Phase 3: State Operations — Undo, Reset, Session Resume

**Rationale:** Undo and session resume depend on the Command model being correct and `_replay_session()` being the single state derivation path. These features are high leverage for user trust — "undo last change" is the first thing users ask for after a mistake. Add them before expanding features.

**Delivers:** `/excel/undo` endpoint (deactivates last Command, replays, returns updated grid AND chart data); `/excel/reset` endpoint (clears all commands); session resume (`GET /excel/conversations`, `GET /excel/conversation/<id>`); APScheduler-based file TTL cleanup job; `os.remove()` wired into conversation deletion.

**Addresses:** Undo last change, session persistence (FEATURES.md); file storage pitfall, chart/grid desync on undo pitfall (PITFALLS.md)

**Avoids:** Chart/grid desync on undo — the `/undo` response contract must include `chart_data` and `has_chart` from day one; replay performance — consider adding a command count cap (e.g., 10 per session) as a simple v1 mitigation before building Redis caching.

**Research flag:** Standard patterns — no phase research needed.

---

### Phase 4: Frontend Integration — ExcelPreview, Split Layout, Full UI Loop

**Rationale:** The frontend can only be meaningfully built once the backend API contract is stable. `ExcelPreview` is the hardest frontend component — it must handle merged cells, frozen panes, and ideally chart objects. The split-pane layout, chat integration, download button, and conversation list are straightforward once the preview renderer exists.

**Delivers:** `ExcelPreview` component rendering `{ columns, rows }` from SheetJS 0.18.5 client-side parsing; split-pane `Dashboard.tsx` layout with chat + preview; `ChatBox` wired to `/excel/transform` with SSE consumption and streaming display; `ChartViewer` reactive to `chartData` updates; download button; `ConversationList` for session resume UI; `useExcelSession` and `useChat` custom hooks extracted from `Dashboard.tsx`; token expiry handled globally via fetch interceptor redirecting to `/auth`; all `alert()` calls replaced with in-UI toast notifications; `AppState` typed with TypeScript union type.

**Uses:** SheetJS 0.18.5 (already installed), react-data-grid 7.0.0-beta.47 (already installed), EventSource API (native browser)

**Addresses:** Spreadsheet preview render, split layout, real-time update, download modified file, error feedback, Spanish-first UX (all FEATURES.md table stakes)

**Avoids:** Token expiry silent failure UX pitfall; `alert()` UX pitfall; `appState` magic string pitfall; hardcoded `localhost:5000` in frontend fetch calls — centralize all API base URLs in `src/utils/api.ts` before this phase.

**Research flag:** `ExcelPreview` rendering of merged cells with react-data-grid is a potential pain point — react-data-grid has limited merged cell support. Verify capability before committing to this approach; fortune-sheet may be needed earlier than v2 if merged cells are common in user files. This warrants a targeted research pass at phase planning time.

---

### Phase 5: Multi-Model Support and User Model Selection

**Rationale:** Multi-model support is a stated product requirement and differentiator. LiteLLM (added in Phase 2) makes the backend changes minimal — the primary work is exposing model selection in the UI and validating each adapter's prompt-to-output contract.

**Delivers:** Claude adapter (Anthropic SDK via LiteLLM); OpenAI/GPT-4 adapter; user-level model preference stored in DB; model selector UI; validated output schema per adapter (Pydantic model enforced at LLMService boundary).

**Addresses:** Multi-model support differentiator (FEATURES.md)

**Research flag:** Standard patterns given LiteLLM abstraction — no phase research needed. Validate `response_format={"type": "json_object"}` behavior for each model via LiteLLM before the phase starts, as Gemini's JSON mode behavior through LiteLLM may differ from the direct SDK.

---

### Phase 6: Polish and Hardening — Formula Explanation, Named Range Awareness, Performance

**Rationale:** Once the core loop is validated and users are retained, add the features that drive loyalty. Formula explanation and named range awareness are low-cost, high-value additions. Performance hardening (DataFrame caching, file size limits, rate limiting) belongs here to avoid premature optimization.

**Delivers:** Formula explanation mode ("what does this formula do?"); named range and table metadata parsed at upload and sent as LLM context; `MAX_CONTENT_LENGTH = 50MB` enforced; per-user rate limiting via Flask-Limiter; NaN sanitization on backend serialization; Plotly dynamic import / code splitting to reduce bundle size.

**Addresses:** Formula explanation, named range awareness (FEATURES.md v1.x); performance traps, rate limiting, file size limit (PITFALLS.md)

**Research flag:** Standard patterns — no phase research needed.

---

### Phase Ordering Rationale

- Auth and DB models must precede all other phases — they are the hard gate for JWT middleware and session persistence.
- Security hardening of `exec()` and prompt injection belong in Phase 2 (when the attack surface is introduced), not in a later "security phase" — shipping an unsandboxed exec endpoint even briefly is unacceptable.
- Undo and session resume (Phase 3) must be built before the full frontend (Phase 4) because they complete the API contract that the frontend consumes. Building the frontend against an incomplete API leads to rework.
- Multi-model support (Phase 5) is deferred from Phase 2 because the foundation (LiteLLM, adapter interface) is established there — Phase 5 only adds concrete adapters and the UI, which is low-risk work.
- Polish and performance (Phase 6) follow validation — optimizing before product-market fit is confirmed is a poor allocation of effort.

### Research Flags

Phases likely needing a targeted research pass during planning:
- **Phase 2 (AI Pipeline):** openpyxl chart API — programmatic chart creation from AI-specified chart types requires type mapping research; the library's chart API surface is complex and not well-covered in common tutorials.
- **Phase 4 (Frontend):** `ExcelPreview` merged cell support in react-data-grid — verify whether react-data-grid handles merged cells adequately or whether fortune-sheet is needed sooner than v2.

Phases with standard well-documented patterns (skip phase research):
- **Phase 1:** JWT auth, SQLAlchemy, Flask file upload — textbook patterns.
- **Phase 3:** Undo via event-sourcing deactivation, APScheduler cleanup — standard patterns.
- **Phase 5:** LiteLLM adapters — abstraction already in place after Phase 2.
- **Phase 6:** Rate limiting, file size limits, NaN sanitization — all standard Flask patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | openpyxl, SheetJS, react-data-grid, APScheduler — HIGH (confirmed in codebase); LiteLLM version requires `pip show litellm` verification in Python 3.12 env before pinning; fortune-sheet production readiness is LOW and unverified |
| Features | MEDIUM | Competitor feature claims (Julius AI, ChatCSV, etc.) drawn from training knowledge (cutoff Aug 2025) without live web verification; openpyxl pivot table limitation is HIGH (documented library constraint); PROJECT.md scope decisions are HIGH |
| Architecture | HIGH | Derived from live codebase analysis; event-sourcing Command log, boundary rules, and data flow are confirmed by direct code reading, not inference |
| Pitfalls | HIGH | All 7 critical pitfalls confirmed by direct analysis of specific files (`code_execution_service.py`, `llm_service.py`, `state_manager.py`, `Dashboard.tsx`, `__init__.py`); these are not speculative — the code exists as described |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **LiteLLM version pin:** Run `pip install litellm && pip show litellm` in the Python 3.12 environment to determine the exact stable version before adding to `Core/requirements.txt`. Do not guess the version number.
- **Flask SSE + Gunicorn buffering:** Verify that the current Gunicorn worker configuration does not buffer SSE responses. May need `--worker-class gevent` or a `X-Accel-Buffering: no` response header.
- **LiteLLM JSON mode with Gemini:** Test `response_format={"type": "json_object"}` with Gemini via LiteLLM — behavior may differ from the direct SDK's `response_mime_type: "application/json"` approach.
- **ExcelPreview merged cell support:** Verify react-data-grid's merged cell capability before Phase 4 begins. If inadequate, fortune-sheet must move from v2 to Phase 4 scope.
- **Competitor feature verification:** All competitor feature comparisons (Julius AI, ChatCSV, Sheet+, Excel Copilot) were drawn from training knowledge without live verification. Spot-check current product pages before the roadmap is finalized if competitive positioning drives feature decisions.

---

## Sources

### Primary (HIGH confidence)
- Live codebase analysis: `Core/app/services/code_execution_service.py` — `exec()` sandbox assessment
- Live codebase analysis: `Core/app/services/llm_service.py` — prompt injection surface, single-model Gemini hardcode
- Live codebase analysis: `Core/app/services/state_manager.py` — file not deleted on conversation deletion, no TTL
- Live codebase analysis: `Core/app/__init__.py` — filesystem session storage, hardcoded JWT fallback secret
- Live codebase analysis: `src/Pages/Dashboard.tsx` — undo chart desync, token expiry not handled globally
- Live codebase analysis: `Core/requirements.txt` + `package.json` — confirmed installed dependency versions
- `.planning/PROJECT.md` — authoritative product requirements and constraints
- `.planning/codebase/ARCHITECTURE.md` + `STRUCTURE.md` — authoritative codebase map
- openpyxl pivot table limitation — well-documented library constraint (openpyxl docs)

### Secondary (MEDIUM confidence)
- Training knowledge of LiteLLM (~1.x), widely adopted as of Aug 2025 training cutoff — version requires live verification
- Training knowledge of Julius AI, ChatCSV, Sheet+, Excel Copilot, Rows AI feature sets — live verification was attempted but web access was unavailable during research
- Community patterns for most-requested Excel formula operations (SUM, VLOOKUP, IF, AVERAGE) — r/excel, r/datascience

### Tertiary (LOW confidence)
- fortune-sheet production readiness for complex Excel files — unverified without testing; verify bundle size and rendering performance before committing to this dependency

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
