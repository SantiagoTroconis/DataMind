# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Full-stack SPA with a decoupled REST API backend

**Key Characteristics:**
- React SPA frontend communicates with a Flask REST API over HTTP on `localhost:5000`
- Backend follows a classic layered architecture: Routes → Services → Models → Database
- Session state (conversation history and uploaded files) is persisted to MySQL, not held in memory
- An LLM (Google Gemini) generates Python code at runtime which is then `exec()`-ed server-side against pandas DataFrames
- The command history uses a soft-delete pattern (`is_active` flag) to implement undo/reset without destroying data

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface for uploading files, chatting with AI, viewing the data grid and charts
- Location: `src/`
- Contains: React pages (`src/Pages/`), reusable components (`src/Components/`)
- Depends on: Flask REST API at `http://localhost:5000`
- Used by: End users via browser

**API / Route Layer (Backend):**
- Purpose: Accept HTTP requests, validate inputs, delegate to services, format JSON responses
- Location: `Core/app/routes/`
- Contains: `auth.py` (auth endpoints), `excel.py` (data transformation and conversation endpoints)
- Depends on: Service layer
- Used by: Frontend fetch calls

**Service Layer (Backend):**
- Purpose: Business logic — authentication, file parsing, LLM code generation, code execution, session state management
- Location: `Core/app/services/`
- Contains:
  - `auth_services.py` — register/login, JWT token creation
  - `excel_service.py` — file I/O, DataFrame serialization
  - `llm_service.py` — Google Gemini API calls, intent classification
  - `code_execution_service.py` — `exec()` of generated Python code against DataFrames and Plotly figures
  - `state_manager.py` — CRUD for Conversation and Command DB records
- Depends on: Model layer, `config/database.py`
- Used by: Route layer

**Model / Data Layer (Backend):**
- Purpose: SQLAlchemy ORM models representing DB schema
- Location: `Core/app/models/`
- Contains:
  - `user.py` — User model with hashed password methods
  - `conversation.py` — Conversation (one per uploaded file)
  - `command.py` — Command (one per user prompt + generated code)
- Depends on: `Core/config/database.py` (SQLAlchemy `Base`)
- Used by: Service layer

**Configuration Layer (Backend):**
- Purpose: Database connection setup
- Location: `Core/config/database.py`
- Contains: SQLAlchemy engine, `SessionLocal`, `Base`
- Depends on: MySQL running on `localhost:3306`
- Used by: Service layer via `SessionLocal()`

## Data Flow

**Upload & View Flow:**

1. User selects an `.xlsx` / `.csv` file in the browser
2. `Dashboard.tsx` POSTs `FormData` to `POST /excel/upload` with JWT in header
3. `excel.py` route calls `StateManager.create_session()` which saves file to disk under `Core/uploads/{user_id}/` and creates a `Conversation` DB record
4. `ExcelService.format_dataframe_response()` serializes the DataFrame to `{ columns, rows }`
5. Response JSON is stored in React state (`gridData`) and rendered by `react-data-grid`

**AI Transform Flow:**

1. User types a natural-language prompt into `ChatBox.tsx`
2. `ChatBox` POSTs `{ session_id, prompt }` to `POST /excel/transform` with JWT
3. `excel.py` route calls `StateManager.get_session()` to reload DataFrame from disk
4. `_replay_session()` helper re-executes all active `Command` records in order to reconstruct current DataFrame state
5. `LLMService.generate_transformation_code()` sends prompt + column names + sample row to Gemini and receives structured JSON `{ intent, code, explanation }`
6. If `intent == DATA_MUTATION`: `CodeExecutionService.execute_transformation()` runs `exec(code)` against the DataFrame; new `Command` is saved to DB; if an active chart code exists it is re-executed reactively
7. If `intent == VISUAL_UPDATE`: `CodeExecutionService.execute_chart_generation()` runs `exec(code)` to produce a Plotly figure; the chart code is stored on the `Command` record; `fig.to_json()` is returned
8. Response JSON (`data`, `chart_data`, `explanation`, `executed_code`) updates React state in `Dashboard.tsx`

**Undo Flow:**

1. User clicks Undo in `Dashboard.tsx`
2. `POST /excel/undo` calls `StateManager.undo_last_command()` which sets the last active `Command.is_active = False` (soft delete)
3. `_replay_session()` replays only the remaining active commands to reconstruct the prior DataFrame state

**Auth Flow:**

1. User submits login form in `Auth.tsx`
2. `POST /auth/login` validates credentials via `AuthService.login()`, returns a JWT
3. Frontend stores `token` and `user` in `localStorage`
4. All subsequent API calls include `Authorization: Bearer <token>` header; Flask routes are protected with `@jwt_required()`

**State Management:**
- React local state (`useState`) in `Dashboard.tsx` holds all UI state: `gridData`, `chartData`, `messages`, `sessionId`, `appState`
- `appState` string (`'landing'` | `'view'` | `'result'`) drives conditional rendering of the main content area
- `sessionId` is also persisted to `sessionStorage` so it survives page refresh
- Auth credentials (`token`, `user`) are stored in `localStorage`
- Server-side session state (conversation + commands) is fully persisted in MySQL; the backend is stateless between requests

## Key Abstractions

**StateManager (`Core/app/services/state_manager.py`):**
- Purpose: Single point of access for all DB operations on `Conversation` and `Command` records
- Pattern: Static method class acting as a service/repository hybrid
- Key methods: `create_session`, `get_session`, `add_command`, `undo_last_command`, `clear_commands`, `get_active_chart_code`, `delete_conversation`

**LLMService (`Core/app/services/llm_service.py`):**
- Purpose: Wraps Google Gemini API; classifies user intent and generates executable Python code
- Pattern: Static method class; prompt engineering returns structured JSON with `{ intent, code, explanation }`
- Two intent types: `DATA_MUTATION` (modifies `df`) and `VISUAL_UPDATE` (creates Plotly `fig`)

**CodeExecutionService (`Core/app/services/code_execution_service.py`):**
- Purpose: Sandbox for executing LLM-generated Python code via `exec()`
- Pattern: Static method class with two entry points — `execute_transformation` (returns modified DataFrame) and `execute_chart_generation` (returns Plotly JSON)
- Isolation: Code runs in a restricted `local_scope` dict; only `pd`, `px`, `go`, `plotly` are injected into `global_scope`

**Command Model (`Core/app/models/command.py`):**
- Purpose: Persisted record of each user prompt + generated code; enables replay and undo
- Pattern: Event-sourcing-style append log with soft delete via `is_active`; the current DataFrame state is always derived by replaying active commands from the initial file

**Dashboard Component (`src/Pages/Dashboard.tsx`):**
- Purpose: Root application shell — owns all UI state, orchestrates all API calls, renders sidebar, data grid, chart panel, and chat box
- Pattern: Single large stateful component acting as the app's controller; child components receive callbacks as props

## Entry Points

**Frontend Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` which executes the Vite-compiled bundle
- Responsibilities: Mounts React root, declares all client-side routes via `react-router-dom`

**Backend Entry:**
- Location: `Core/run.py`
- Triggers: `python run.py` or Gunicorn in Docker
- Responsibilities: Calls `create_app()`, starts Flask dev server on port 5000

**Flask App Factory:**
- Location: `Core/app/__init__.py`
- Responsibilities: Configures JWT, CORS, filesystem sessions, registers blueprints at `/excel` and `/auth`

**Blueprint Registration:**
- Location: `Core/app/routes/__init__.py`
- Registers: `excel_bp` at `/excel`, `auth_bp` at `/auth`

## Error Handling

**Strategy:** Exceptions bubble up to route handlers which catch `ValueError` (client error → 400/403/404) and generic `Exception` (server error → 500) and return JSON `{ "error": "..." }`

**Patterns:**
- `StateManager` methods use try/except with `session.rollback()` on failure and always `session.close()` in `finally`
- `CodeExecutionService` wraps `exec()` in try/except and re-raises with traceback details
- `LLMService` re-raises with raw response text appended for debugging
- Frontend shows `toast.error(...)` notifications via `sonner` on failed fetch calls

## Cross-Cutting Concerns

**Logging:** `print()` statements only; no structured logging framework
**Validation:** Route-level: missing fields checked manually and return 400; no schema validation library
**Authentication:** JWT via `flask-jwt-extended`; `@jwt_required()` decorator on all `/excel/*` routes; frontend reads `token` from `localStorage` and injects into every request header
**CORS:** Enabled globally via `flask-cors` with no origin restriction (`CORS(app)`)
**File Storage:** Uploaded files stored on local disk at `Core/uploads/{user_id}/{uuid}_{filename}`; path recorded in `Conversation.file_path`
**Session Limit:** `StateManager.create_session` enforces a hard cap of 2 active conversations per user

---

*Architecture analysis: 2026-03-06*
