# Architecture Research

**Domain:** AI-powered Excel editor (chat-driven, server-side file processing)
**Researched:** 2026-03-06
**Confidence:** HIGH (derived from live codebase analysis + established architectural patterns)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                           │
│                                                                      │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │  ChatBox    │   │  ExcelPreview    │   │  ChartViewer         │  │
│  │  (chat UI)  │   │  (data grid)     │   │  (Plotly render)     │  │
│  └──────┬──────┘   └────────┬─────────┘   └──────────┬───────────┘  │
│         │                   │                         │              │
│         └───────────────────┴─────────────────────────┘             │
│                             │                                        │
│                    Dashboard.tsx (state owner)                       │
│                    gridData / chartData / messages                   │
│                    sessionId / appState / token                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  HTTP (JSON) + JWT
                               │  multipart/form-data on upload
┌──────────────────────────────▼───────────────────────────────────────┐
│                        BACKEND (FastAPI / Flask)                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Route Layer                              │   │
│  │   /auth/*          /excel/upload    /excel/transform         │   │
│  │   /excel/undo      /excel/reset     /excel/conversations     │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                             │   │
│  │  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐ │   │
│  │  │ LLMService  │  │ CodeExecution │  │  ExcelService      │ │   │
│  │  │ (intent +   │  │ Service       │  │  (file I/O,        │ │   │
│  │  │  codegen)   │  │ (exec sandbox)│  │   DataFrame I/O)   │ │   │
│  │  └─────────────┘  └───────────────┘  └────────────────────┘ │   │
│  │  ┌─────────────┐  ┌───────────────┐                          │   │
│  │  │ StateManager│  │ AuthService   │                          │   │
│  │  │ (DB CRUD)   │  │ (JWT)         │                          │   │
│  │  └─────────────┘  └───────────────┘                          │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌───────────────────┐   ┌────▼──────────────┐                      │
│  │  Local Disk       │   │  MySQL Database   │                      │
│  │  Core/uploads/    │   │  users            │                      │
│  │  {user_id}/{uuid} │   │  conversations    │                      │
│  │  _filename.xlsx   │   │  commands         │                      │
│  └───────────────────┘   └───────────────────┘                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │      External AI Provider        │
              │  Google Gemini (current)         │
              │  Claude / GPT-4 (planned)        │
              └──────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `Dashboard.tsx` | Root state owner — holds all UI state, orchestrates API calls, renders split layout | `src/Pages/Dashboard.tsx` |
| `ChatBox.tsx` | Captures user prompt, sends to `/excel/transform`, displays message history | `src/Components/ChatBox.tsx` |
| `ExcelPreview` | Renders `{ columns, rows }` JSON as a read-only spreadsheet grid | to be built (`src/Components/`) |
| `ChartViewer.tsx` | Renders Plotly JSON figure; client-side refresh on data change | `src/Components/ChartViewer.tsx` |
| Route Layer | HTTP boundary — validates auth, delegates to services, returns JSON | `Core/app/routes/` |
| `LLMService` | Classifies user intent (`DATA_MUTATION` / `VISUAL_UPDATE`), generates executable Python code via AI API | `Core/app/services/llm_service.py` |
| `CodeExecutionService` | Executes LLM-generated Python in a sandboxed `exec()` scope; returns modified DataFrame or Plotly figure | `Core/app/services/code_execution_service.py` |
| `ExcelService` | Reads/writes `.xlsx` files to disk; serializes pandas DataFrame to `{ columns, rows }` JSON | `Core/app/services/excel_service.py` |
| `StateManager` | All DB access for `Conversation` and `Command` records; implements event-sourcing replay | `Core/app/services/state_manager.py` |
| `AuthService` | User registration, login, JWT issuance | `Core/app/services/auth_services.py` |
| MySQL | Persists users, conversations (with file path), commands (with generated code + is_active flag) | external container |
| Local Disk | Stores original uploaded Excel files; path is the source of truth for state replay | `Core/uploads/` |

---

## File Flow: Upload → Modify → Download

### Upload Flow

```
Browser                           Backend                         Disk + DB
  │                                  │                               │
  │── POST /excel/upload ──────────▶ │                               │
  │   (multipart/form-data + JWT)    │                               │
  │                                  │── save file ────────────────▶ │
  │                                  │   Core/uploads/{uid}/{uuid}_  │
  │                                  │   filename.xlsx               │
  │                                  │                               │
  │                                  │── INSERT Conversation ───────▶ │
  │                                  │   (file_path, user_id)        │
  │                                  │                               │
  │                                  │── parse DataFrame             │
  │                                  │── serialize to {columns,rows} │
  │◀─ { session_id, columns, rows } ─│                               │
  │                                  │                               │
  │  render ExcelPreview grid        │                               │
  │  store sessionId in sessionStorage                               │
```

### AI Transform Flow

```
Browser                    Backend                           AI Provider
  │                           │                                   │
  │── POST /excel/transform ─▶│                                   │
  │   { session_id, prompt }  │                                   │
  │                           │── load original file from disk    │
  │                           │── _replay_session():              │
  │                           │   for each active Command         │
  │                           │     exec(command.code, df)        │
  │                           │   → current DataFrame state       │
  │                           │                                   │
  │                           │── build prompt context ──────────▶│
  │                           │   (user prompt + column names     │
  │                           │    + sample rows)                 │
  │                           │                                   │
  │                           │◀── { intent, code, explanation } ─│
  │                           │                                   │
  │                           │── CodeExecutionService.exec(code) │
  │                           │   DATA_MUTATION → modified df     │
  │                           │   VISUAL_UPDATE → Plotly fig JSON │
  │                           │                                   │
  │                           │── INSERT Command                  │
  │                           │   (prompt, code, chart_code,      │
  │                           │    is_active=True)                │
  │                           │                                   │
  │◀── { data, chart_data,   ─│                                   │
  │      explanation,          │                                   │
  │      executed_code }       │                                   │
  │                           │                                   │
  │  update gridData          │                                   │
  │  update chartData         │                                   │
  │  append to messages[]     │                                   │
```

### Download Flow

```
Browser                    Backend
  │                           │
  │── GET /excel/download ───▶│
  │   { session_id }          │
  │                           │── load original file from disk
  │                           │── _replay_session() → final DataFrame
  │                           │── openpyxl: write DataFrame back to .xlsx
  │                           │── stream file bytes
  │                           │
  │◀── file bytes (.xlsx) ────│
  │                           │
  │  browser triggers download│
```

---

## How the AI Interprets Intent and Translates to Excel Operations

### Current Pattern: Code Generation via LLM

The `LLMService` sends a structured prompt to the AI provider containing:
- The user's natural-language request
- Column names of the current DataFrame
- A sample of the data rows (first N rows)
- Strict output format instructions

The AI returns structured JSON:
```json
{
  "intent": "DATA_MUTATION",
  "code": "df['Total'] = df['Sales'] * df['Price']",
  "explanation": "Added a Total column multiplying Sales by Price"
}
```

Two intent classes:
- `DATA_MUTATION` — modifies the DataFrame (`df`); persisted as a `Command` and replayed for all subsequent requests
- `VISUAL_UPDATE` — generates a Plotly figure (`fig`); chart code is stored on the `Command` record and re-executed reactively when the DataFrame changes

### Planned Improvement: Multi-Model Adapter

The `LLMService` currently hard-codes Google Gemini. The target architecture is an adapter interface:

```
LLMService (abstract interface)
    ├── GeminiAdapter (current implementation)
    ├── ClaudeAdapter (planned)
    └── OpenAIAdapter (planned)
```

Each adapter implements the same contract:
- Input: `{ prompt, columns, sample_rows, conversation_history }`
- Output: `{ intent, code, explanation }`

The route layer calls `LLMService.generate_transformation_code()` and is unaware of which model is active. The active model is configurable per-user or per-session via a settings field.

---

## Real-Time Preview: How Changes Reach the Frontend

### Current Pattern: Request-Response (Polling on demand)

The current implementation is synchronous HTTP: the transform request blocks until the AI call and `exec()` complete, then returns the full new grid data and chart JSON in the response body. The frontend replaces `gridData` and `chartData` state on receipt.

This is a **pull model** — the frontend learns of changes only when it gets a transform response back.

### Why This Works for v1

- Excel operations (cell edit, formula, chart) complete in under 3 seconds in typical cases
- A loading spinner in `ChatBox` covers the latency window
- No additional infrastructure (WebSockets, SSE) is needed

### Streaming Option (for future phases)

For long-running operations or a token-by-token explanation stream, Server-Sent Events (SSE) can be added to the existing Flask backend without requiring a full WebSocket server:

```
Browser                    Backend
  │── POST /excel/transform ─▶│
  │◀── SSE stream begins ─────│
  │   event: thinking         │  (explanation tokens)
  │   event: code_ready       │  (trigger execution)
  │   event: data_update      │  (new grid data)
  │   event: done             │
```

This is a phase 3+ concern. The synchronous pattern is correct for v1.

---

## Conversation and File State Management

### State Ownership Split

| State | Where Stored | Lifetime | Why |
|-------|-------------|----------|-----|
| `gridData` (rendered JSON) | React `useState` in `Dashboard.tsx` | Page session | Fast re-render; lost on refresh, reloaded from backend |
| `chartData` (Plotly JSON) | React `useState` in `Dashboard.tsx` | Page session | Same as gridData |
| `messages[]` (chat history) | React `useState` in `Dashboard.tsx` | Page session | UI-only; fetched from DB on session resume |
| `sessionId` | `sessionStorage` | Tab lifetime | Survives page refresh within same tab |
| `token` / `user` | `localStorage` | Until logout | Cross-tab auth persistence |
| `Conversation` record | MySQL | TTL (TBD) | File path + ownership; survives server restart |
| `Command` records | MySQL | Same as Conversation | Event log; enables replay and undo |
| Raw `.xlsx` file | Local disk | Same as Conversation | Source of truth for replay |

### Event-Sourcing Pattern (Current)

The backend never stores the "current" DataFrame. It stores only:
1. The original uploaded file (immutable)
2. An ordered log of `Command` records (each with Python code to execute)

Current state = replay all `is_active=True` commands in order against the original file.

This gives undo for free (set `is_active=False` on the last command, replay again) and prevents data corruption from failed mid-session writes.

**Implication for build order:** The `_replay_session()` helper and `Command` model must be established before any AI transform feature is shipped. They are the foundation of all state.

### Session Resume Flow

When an authenticated user returns to a previous session:
1. Frontend fetches `GET /excel/conversations` → list of Conversation records
2. User selects one → frontend fetches the conversation's last-known grid state
3. Backend replays all active commands to reconstruct current DataFrame
4. Frontend receives `{ columns, rows }` and renders the grid as if the user never left

---

## Component Boundaries

### Boundary Map

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Boundary                  │
│                                                      │
│  ChatBox ──────────── sends prompt via callback ──▶  │
│  ExcelPreview ◀─────── receives { columns, rows } ── │
│  ChartViewer ◀──────── receives Plotly JSON ──────── │
│                                                      │
│  All external calls go through Dashboard.tsx         │
│  No child component talks to the backend directly    │
└──────────────────────────┬──────────────────────────┘
                           │  HTTP (REST)
┌──────────────────────────▼──────────────────────────┐
│                   Backend Boundary                   │
│                                                      │
│  Routes: input validation + auth only                │
│  Services: all logic (never import from routes)      │
│  Models: DB schema only (no business logic)          │
│  StateManager: single DB access point                │
└──────────────────────────┬──────────────────────────┘
                           │  API call
┌──────────────────────────▼──────────────────────────┐
│              AI Provider Boundary                    │
│                                                      │
│  LLMService: only component that calls AI APIs       │
│  CodeExecutionService: only component that exec()s   │
│  No other service imports from either                │
└─────────────────────────────────────────────────────┘
```

### Key Rules Per Boundary

| Boundary | Rule | Violation Consequence |
|----------|------|-----------------------|
| Frontend: child → backend | Never. All calls through Dashboard.tsx | State fragmentation, race conditions |
| Backend: routes → models | Never directly. Always through services | Untestable business logic in HTTP layer |
| Backend: services → LLMService | Only `llm_service.py` calls AI APIs | Multiple API key locations, cost leakage |
| Backend: services → CodeExecutionService | Only `code_execution_service.py` calls `exec()` | Security surface expansion |

---

## Recommended Project Structure (Target State)

```
DataMind/
├── src/
│   ├── Pages/
│   │   ├── Dashboard.tsx          # Main split layout (chat + preview)
│   │   ├── Auth.tsx               # Login page
│   │   ├── Register.tsx           # Registration page
│   │   ├── Landing.tsx            # Marketing page
│   │   ├── AboutUs.tsx
│   │   └── NotFound.tsx
│   ├── Components/
│   │   ├── ChatBox.tsx            # Chat panel (input + message list)
│   │   ├── ExcelPreview.tsx       # Data grid (read-only spreadsheet view)
│   │   ├── ChartViewer.tsx        # Plotly chart renderer
│   │   ├── FileUploader.tsx       # Drag-drop upload UI + progress
│   │   ├── CodePreview.tsx        # Shows AI-generated code to user
│   │   ├── ConversationList.tsx   # Session resume sidebar
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── hooks/                     # (to be created)
│   │   ├── useExcelSession.ts     # Session management logic
│   │   └── useChat.ts             # Chat state + send logic
│   ├── utils/                     # (to be created)
│   │   └── api.ts                 # Typed fetch wrappers for all endpoints
│   └── main.tsx
│
└── Core/
    ├── app/
    │   ├── routes/
    │   │   ├── auth.py
    │   │   └── excel.py
    │   ├── services/
    │   │   ├── auth_services.py
    │   │   ├── excel_service.py
    │   │   ├── llm_service.py         # Abstract + current Gemini impl
    │   │   ├── llm_adapters/          # (to be created)
    │   │   │   ├── base.py            # Abstract LLMAdapter interface
    │   │   │   ├── gemini.py
    │   │   │   ├── claude.py
    │   │   │   └── openai.py
    │   │   ├── code_execution_service.py
    │   │   └── state_manager.py
    │   └── models/
    │       ├── user.py
    │       ├── conversation.py
    │       └── command.py
    └── config/
        └── database.py
```

---

## Architectural Patterns

### Pattern 1: Event-Sourcing Command Log

**What:** Never store derived state. Store only the original file + an ordered append log of transformation commands. Reconstruct current state by replaying the log.

**When to use:** Any domain where undo, history, and auditability matter — which is every Excel editor.

**Trade-offs:**
- Pro: Free undo, debuggable history, server-restart safe
- Pro: No need to write partial state to disk on every operation
- Con: Replay cost grows with number of commands (mitigated by snapshot caching at a later phase)
- Con: Complex to reason about if `_replay_session()` logic is scattered

**Constraint:** Keep `_replay_session()` as the single path to compute current state. Never bypass it by computing state elsewhere.

### Pattern 2: Intent Classification Before Code Generation

**What:** The AI call returns two fields: `intent` (classification) and `code` (executable Python). The route handler branches on `intent` before passing `code` to the execution service.

**When to use:** Always — the intent determines which execution path and storage pattern applies.

**Trade-offs:**
- Pro: Clean separation between "what the user wanted" and "how we did it"
- Pro: Easy to add new intent types (e.g., `FORMATTING`, `FORMULA_ONLY`) without touching the LLM prompt contract
- Con: Adds one round of classification latency; not a concern at current scale

### Pattern 3: Multi-Model Adapter via Dependency Injection

**What:** `LLMService` defines an interface contract. Concrete implementations (Gemini, Claude, OpenAI) are registered adapters. The active adapter is selected at request time based on user preference or server config.

**When to use:** Required from v1 because multi-model support is a stated product requirement.

**Trade-offs:**
- Pro: No lock-in to any single provider
- Pro: A/B testing of models is trivial
- Con: Every adapter must conform to the same output schema (`{ intent, code, explanation }`) — prompt engineering work per adapter

**Implementation note:** The output contract must be enforced with schema validation (Pydantic model) at the `LLMService` boundary, not in the route. If the AI returns malformed JSON, the error is caught before execution.

### Pattern 4: Dashboard as Single State Owner

**What:** `Dashboard.tsx` owns all application state. Child components (`ChatBox`, `ExcelPreview`, `ChartViewer`) receive data as props and emit events via callbacks. No child component calls the backend directly.

**When to use:** Correct for v1 given the limited component count. Avoids premature state management library overhead.

**Trade-offs:**
- Pro: Predictable data flow, easy to trace bugs
- Pro: No external state library (Redux, Zustand) needed at this scale
- Con: `Dashboard.tsx` will grow large; mitigate by extracting logic to custom hooks (`useExcelSession`, `useChat`)
- Con: All re-renders flow through Dashboard; acceptable at this component tree depth

---

## Data Flow

### Upload and First Render

```
User selects file
    ↓
FileUploader → Dashboard (file object)
    ↓
Dashboard → POST /excel/upload (FormData)
    ↓
ExcelService: save to disk, parse DataFrame
StateManager: INSERT Conversation
ExcelService: serialize { columns, rows }
    ↓
Dashboard receives { session_id, columns, rows }
    ↓
gridData state updated → ExcelPreview re-renders
sessionId stored in sessionStorage
appState → 'view'
```

### Chat Transform

```
User types message
    ↓
ChatBox → Dashboard (prompt string via callback)
    ↓
Dashboard appends optimistic message to messages[]
Dashboard → POST /excel/transform { session_id, prompt }
    ↓
Route: authenticate JWT
StateManager: load Conversation (get file_path)
ExcelService: read file_path → base DataFrame
_replay_session(): exec all active Commands → current DataFrame
LLMService: send (prompt + columns + sample) to AI API
    → { intent, code, explanation }
CodeExecutionService: exec(code) in sandboxed scope
    DATA_MUTATION → modified DataFrame serialized
    VISUAL_UPDATE → Plotly fig.to_json()
StateManager: INSERT Command (prompt, code, is_active=True)
    ↓
Dashboard receives { data, chart_data, explanation, executed_code }
    ↓
gridData updated → ExcelPreview re-renders
chartData updated → ChartViewer re-renders
messages[] updated with AI response
```

### Undo

```
User clicks Undo
    ↓
Dashboard → POST /excel/undo { session_id }
    ↓
StateManager: UPDATE last Command SET is_active=False
_replay_session(): replay remaining active Commands
ExcelService: serialize restored DataFrame
    ↓
Dashboard receives restored { data }
gridData updated → ExcelPreview re-renders
```

### State Management Summary

```
sessionStorage          localStorage            React State (Dashboard)
─────────────────────   ──────────────────────  ──────────────────────────
sessionId               token                   gridData
                        user (id, email)        chartData
                                                messages[]
                                                sessionId (copy)
                                                appState
                                                isLoading
```

---

## Suggested Build Order (Phase Dependencies)

The architecture has clear dependency layers. Build bottom-up.

### Layer 0: Foundation (must exist before anything else)

1. **Auth system** (`/auth/register`, `/auth/login`, JWT middleware)
   - All Excel endpoints require JWT. Auth is a gate.
2. **Conversation + Command DB models** + `StateManager`
   - Every subsequent feature writes to or reads from these tables.
3. **File upload + ExcelService** (`/excel/upload`, disk storage, DataFrame serialization)
   - The upload creates the `Conversation` record that all other operations reference.

### Layer 1: Core AI Pipeline

4. **`LLMService`** (intent classification + code generation)
   - Depends on: Layer 0 (needs Conversation context for prompt)
5. **`CodeExecutionService`** (exec sandbox)
   - Depends on: Layer 1 (needs generated code from LLMService)
6. **`/excel/transform` route** + `_replay_session()` helper
   - Depends on: Layers 0 + 1

### Layer 2: State Operations

7. **Undo** (`/excel/undo`) — trivial once Command model exists
8. **Reset** (`/excel/reset`) — clear all commands, replay from original
9. **Session resume** (`GET /excel/conversations`, `GET /excel/conversation/<id>`)

### Layer 3: Frontend

10. **ExcelPreview grid** (renders `{ columns, rows }`)
    - Depends on: Layer 0 (upload endpoint returning grid data)
11. **ChatBox → Dashboard integration** (send prompt, display response)
    - Depends on: Layer 1 (transform endpoint)
12. **ChartViewer integration** (render Plotly JSON from transform response)
    - Depends on: Layer 1
13. **Download button** (triggers file export from current state)
    - Depends on: Layer 2 (clean final state)
14. **ConversationList** (session resume UI)
    - Depends on: Layer 2 (conversations endpoint)

### Layer 4: Multi-Model

15. **LLM Adapter interface** + Claude/OpenAI adapters
    - Depends on: Layer 1 (existing Gemini adapter as reference implementation)
    - No UI changes required; adapter selection via config or user settings

---

## Scaling Considerations

| Scale | Architecture Adjustment |
|-------|------------------------|
| 0-500 users | Current monolith is correct. Local disk storage, single MySQL instance. |
| 500-5k users | Disk I/O becomes the bottleneck. Move file storage to object storage (S3 / R2). Replay cost grows — add snapshot caching (store last-known DataFrame state as Parquet alongside the file). |
| 5k-50k users | AI API latency and cost dominate. Add request queuing (Celery + Redis) so transform requests don't block HTTP threads. SSE for streaming progress. |
| 50k+ users | Horizontal backend scaling. Separate file processing workers from API servers. Consider managed AI gateway for rate limiting and cost attribution. |

### First Bottleneck: AI API Latency

The Gemini/Claude API call takes 1-5 seconds. At v1 scale this is acceptable with a loading state. The first optimization is prompt caching (sending system prompts that qualify for provider-level caching), not infrastructure changes.

### Second Bottleneck: Replay Cost

With many commands per session, `_replay_session()` grows O(n) in commands. The mitigation is periodic snapshots: after N commands, serialize the current DataFrame to disk as a checkpoint. Replay from the latest checkpoint rather than the original file. This is a phase 3+ optimization.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Derived State (Current DataFrame) to DB

**What people do:** After each transform, serialize the full DataFrame to the database or a new file on disk.

**Why it's wrong:** Creates two sources of truth (original file + derived state). Any bug in state transitions is impossible to debug. Undo requires storing previous states explicitly. Storage cost grows quadratically.

**Do this instead:** Store only the original file and the command log. Derive state by replay. This is what the current event-sourcing design does correctly.

### Anti-Pattern 2: Direct exec() Without Scope Restriction

**What people do:** Call `exec(llm_generated_code)` in the global scope or with access to all imports.

**Why it's wrong:** The LLM could generate code that reads environment variables, calls `os.system()`, or imports `subprocess`. This is a critical security hole in any system that executes AI-generated code.

**Do this instead:** The current `CodeExecutionService` already does this correctly — it creates a restricted `local_scope` dict and injects only `pd`, `px`, `go`, `plotly` into `global_scope`. This pattern must be maintained. Any new execution path must go through this service.

### Anti-Pattern 3: Child Components Calling the Backend

**What people do:** Give `ChatBox.tsx` its own `fetch('/excel/transform')` call to avoid prop drilling.

**Why it's wrong:** Creates split state — Dashboard knows about the old gridData, ChatBox has the new response, they are now out of sync. Race conditions multiply.

**Do this instead:** All API calls go through `Dashboard.tsx` (or a custom hook it delegates to). Children emit intents upward via callbacks, never call fetch themselves.

### Anti-Pattern 4: Unguarded Code Execution on Any String

**What people do:** Skip the intent classification step and directly execute whatever the LLM returns.

**Why it's wrong:** Without intent routing, there is no way to distinguish a destructive operation (reset all data) from a benign one (format a column). Logging, undo, and auditability all require knowing what class of operation was requested.

**Do this instead:** Every transform response from the LLM must include an `intent` field. The route handler validates `intent` is in the allowed enum before dispatching to `CodeExecutionService`.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Gemini API | HTTP POST from `LLMService`; API key in `.env`; structured prompt returns JSON | Current implementation. Swap-out target for multi-model adapter. |
| Claude API | Adapter implementing same interface as Gemini adapter | Requires Anthropic SDK; output schema must match `{ intent, code, explanation }` |
| OpenAI API | Same adapter pattern | GPT-4 function calling is a natural fit for structured output here |
| MySQL | SQLAlchemy ORM via `SessionLocal()`; all access through `StateManager` | Must be containerized for Docker parity between dev and prod |

### Internal Boundaries

| Boundary | Communication | Rule |
|----------|---------------|------|
| `Dashboard.tsx` ↔ `ChatBox.tsx` | Props (data down) + callbacks (events up) | ChatBox never calls fetch |
| `Dashboard.tsx` ↔ `ExcelPreview` | Props only | ExcelPreview is a pure display component |
| `Dashboard.tsx` ↔ `ChartViewer.tsx` | Props only | ChartViewer only renders, never requests |
| Route Layer ↔ Service Layer | Direct Python function calls | Routes import services; services never import routes |
| `LLMService` ↔ AI Providers | HTTP via provider SDK | Only LLMService holds API keys; no other service calls AI |
| `StateManager` ↔ MySQL | SQLAlchemy `SessionLocal()` | All DB access through StateManager; no raw SQL elsewhere |
| `CodeExecutionService` ↔ `exec()` | Restricted scope dict | No other service calls exec() |

---

## Sources

- Live codebase analysis: `.planning/codebase/ARCHITECTURE.md` (HIGH confidence — derived from actual code)
- Live codebase analysis: `.planning/codebase/STRUCTURE.md` (HIGH confidence — derived from actual code)
- Project requirements: `.planning/PROJECT.md` (HIGH confidence — authoritative spec)
- Event-sourcing pattern: well-established architectural pattern; applied here to the Command log design already present in the codebase
- exec() sandboxing: standard security practice for AI code execution; current implementation in `CodeExecutionService` is the reference

---

*Architecture research for: AI-powered Excel editor (DataMind)*
*Researched: 2026-03-06*
