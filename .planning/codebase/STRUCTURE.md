# Codebase Structure

**Analysis Date:** 2026-03-06

## Directory Layout

```
DataMind/                        # Monorepo root
├── src/                         # React/TypeScript frontend (Vite SPA)
│   ├── Pages/                   # Route-level page components
│   ├── Components/              # Reusable UI components
│   ├── main.tsx                 # App entry point & router setup
│   └── index.css                # Global styles (Tailwind imports)
├── public/                      # Static assets (logo SVG, etc.)
├── Core/                        # Flask/Python backend
│   ├── app/                     # Flask application package
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── routes/              # Flask Blueprints (HTTP layer)
│   │   ├── services/            # Business logic layer
│   │   ├── __init__.py          # App factory (create_app)
│   │   └── extensions.py        # (stub file, currently unused)
│   ├── config/
│   │   └── database.py          # SQLAlchemy engine & SessionLocal
│   ├── uploads/                 # Uploaded user files (runtime, gitignored)
│   ├── flask_session/           # Filesystem session store (runtime)
│   ├── run.py                   # Backend entry point
│   ├── requirements.txt         # Python dependencies
│   ├── DockerFile               # Backend Docker image
│   └── .env                     # Backend environment variables (gitignored)
├── dist/                        # Frontend production build output (gitignored)
├── node_modules/                # JS dependencies (gitignored)
├── index.html                   # Vite HTML entry shell
├── package.json                 # Frontend dependencies & scripts
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # TypeScript config for src/
├── tsconfig.node.json           # TypeScript config for vite.config
├── eslint.config.js             # ESLint configuration
├── docker-compose.yml           # Docker Compose (backend service)
└── .planning/                   # GSD planning documents
    └── codebase/                # Codebase analysis docs
```

## Directory Purposes

**`src/Pages/`:**
- Purpose: Full-page React components, one per route
- Contains: `Landing.tsx`, `Auth.tsx`, `Register.tsx`, `Dashboard.tsx`, `AboutUs.tsx`, `NotFound.tsx`
- Key files: `src/Pages/Dashboard.tsx` — the main application page; owns all app state

**`src/Components/`:**
- Purpose: Reusable React components used by pages
- Contains: `ChatBox.tsx`, `ChartViewer.tsx`, `CodePreview.tsx`, `Navbar.tsx`, `Footer.tsx`
- Key files:
  - `src/Components/ChatBox.tsx` — floating AI chat panel; calls `/excel/transform`
  - `src/Components/ChartViewer.tsx` — Plotly chart renderer with client-side refresh logic

**`Core/app/routes/`:**
- Purpose: HTTP request handling only; no business logic
- Contains: `auth.py` (login, register), `excel.py` (upload, transform, undo, reset, conversations, conversation CRUD)
- Key file: `Core/app/routes/excel.py` — all data pipeline endpoints

**`Core/app/services/`:**
- Purpose: All business logic and external API calls
- Contains:
  - `Core/app/services/state_manager.py` — DB operations for conversations/commands
  - `Core/app/services/llm_service.py` — Google Gemini integration
  - `Core/app/services/code_execution_service.py` — `exec()` sandbox for generated code
  - `Core/app/services/excel_service.py` — file I/O and DataFrame serialization
  - `Core/app/services/auth_services.py` — user auth and JWT issuance

**`Core/app/models/`:**
- Purpose: SQLAlchemy ORM model definitions; each file is one table
- Contains: `user.py` (users table), `conversation.py` (conversations table), `command.py` (commands table)

**`Core/config/`:**
- Purpose: Infrastructure configuration
- Key file: `Core/config/database.py` — database URL, engine, `SessionLocal`, `Base`

**`Core/uploads/`:**
- Purpose: Runtime storage for uploaded Excel/CSV files; organized as `uploads/{user_id}/{uuid}_{filename}`
- Generated: Yes (created at runtime by `ExcelService.save_file_to_disk`)
- Committed: No

**`Core/flask_session/`:**
- Purpose: Filesystem-backed Flask session store
- Generated: Yes
- Committed: No

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Frontend entry; mounts React root and declares all client-side routes
- `Core/run.py`: Backend entry; calls `create_app()` and starts Flask on port 5000
- `Core/app/__init__.py`: Flask app factory; registers extensions and blueprints
- `index.html`: HTML shell loaded by Vite

**Configuration:**
- `Core/config/database.py`: SQLAlchemy connection (MySQL URL hardcoded — see CONCERNS)
- `Core/app/__init__.py`: JWT secret key, session type, CORS, blueprint registration
- `vite.config.ts`: Vite/React build setup
- `tsconfig.app.json`: TypeScript compiler options for `src/`
- `Core/.env`: Backend secrets (GEMINI_API_KEY, JWT_SECRET_KEY) — not committed

**Core Logic:**
- `Core/app/routes/excel.py`: All data pipeline HTTP endpoints; contains `_replay_session()` helper
- `Core/app/services/state_manager.py`: All DB access for conversations and commands
- `Core/app/services/llm_service.py`: Gemini prompt construction and response parsing
- `Core/app/services/code_execution_service.py`: `exec()` wrapper for generated Python
- `src/Pages/Dashboard.tsx`: Frontend app controller; all API calls and UI state live here

**Models:**
- `Core/app/models/user.py`: User schema + password hashing
- `Core/app/models/conversation.py`: Conversation schema (file path, user ownership)
- `Core/app/models/command.py`: Command schema (prompt, generated code, chart code, is_active)

## Naming Conventions

**Files:**
- Backend Python: `snake_case.py` (e.g., `excel_service.py`, `state_manager.py`)
- Frontend TypeScript/React: `PascalCase.tsx` for components and pages (e.g., `ChatBox.tsx`, `Dashboard.tsx`)
- Config files: lowercase with dots (e.g., `vite.config.ts`, `eslint.config.js`)

**Directories:**
- Frontend: `PascalCase` for component directories (`Pages/`, `Components/`)
- Backend: `snake_case` (`models/`, `routes/`, `services/`, `config/`)

**React Components:**
- Named exports for components used as sub-components: `export function ChatBox(...)`, `export const ChartViewer`
- Default exports for page-level components: `export default Dashboard`

**Backend Classes:**
- Service classes use `PascalCase` with all `@staticmethod` methods: `StateManager`, `LLMService`, `ExcelService`, `CodeExecutionService`, `AuthService`
- Blueprint variables: `snake_case` with `_bp` suffix: `excel_bp`, `auth_bp`

**API Endpoints:**
- All prefixed by blueprint: `/excel/...`, `/auth/...`
- Resources use kebab-case nouns: `/excel/conversations`, `/excel/conversation/<id>`

## Where to Add New Code

**New API endpoint:**
- Add route handler to the appropriate blueprint in `Core/app/routes/` (e.g., `Core/app/routes/excel.py`)
- If a new domain, create a new blueprint file and register it in `Core/app/routes/__init__.py`
- Put business logic in a new or existing service in `Core/app/services/`

**New database table:**
- Create model file in `Core/app/models/` following the pattern in `Core/app/models/command.py`
- Import and expose it from `Core/app/models/__init__.py`
- Add table creation to DB migration or initialization script

**New frontend page:**
- Create `src/Pages/YourPage.tsx` with a default export
- Register a `<Route>` in `src/main.tsx`

**New reusable UI component:**
- Create `src/Components/YourComponent.tsx` with a named export
- Import into the page that uses it (currently `Dashboard.tsx` or `Auth.tsx`)

**New service / business logic:**
- Create `Core/app/services/your_service.py` as a class with `@staticmethod` methods
- Import and call from the relevant route file

**Utilities / shared frontend helpers:**
- Currently no `utils/` directory exists; inline helpers are defined within the file that uses them (e.g., `generateCsvFile` exists in both `Dashboard.tsx` and `ChatBox.tsx`)
- If adding shared utilities, create `src/utils/` and place files there

## Special Directories

**`dist/`:**
- Purpose: Vite production build output (`npm run build`)
- Generated: Yes
- Committed: No (in `.gitignore`)

**`Core/uploads/`:**
- Purpose: Persistent user file storage; referenced by path in the `Conversation` table
- Generated: Yes (auto-created by `ExcelService.save_file_to_disk`)
- Committed: No

**`Core/flask_session/`:**
- Purpose: Flask-Session filesystem session store
- Generated: Yes
- Committed: No

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by `/gsd:plan-phase` and `/gsd:execute-phase`
- Generated: Yes (by GSD map-codebase command)
- Committed: Up to team preference

---

*Structure analysis: 2026-03-06*
