# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript ~5.9.3 - Frontend (all `.ts`/`.tsx` files in `src/`)
- Python 3.12 - Backend (all files in `Core/`)

**Secondary:**
- CSS - Styling via Tailwind utility classes in `src/index.css`

## Runtime

**Frontend Environment:**
- Browser (ES2022 target, DOM APIs)
- Node.js (dev tooling only)

**Backend Environment:**
- Python 3.12 (Docker base image: `python:3.12-slim`)
- Gunicorn 23.0.0 (production WSGI server)
- Flask dev server (local development via `Core/run.py`)

**Package Manager:**
- Frontend: npm - Lockfile: `package-lock.json` (present)
- Backend: pip - Lockfile: `Core/requirements.txt` (present, pinned versions)

## Frameworks

**Frontend Core:**
- React 18.3.1 - UI component framework (`src/`)
- React Router DOM 7.11.0 - Client-side routing (`src/main.tsx`)
- Tailwind CSS 4.1.17 - Utility-first CSS framework (configured via `@tailwindcss/vite` plugin)

**Backend Core:**
- Flask 3.1.2 - Python web framework (`Core/app/__init__.py`)
- Flask-CORS 6.0.1 - Cross-origin request support
- Flask-JWT-Extended 4.7.1 - JWT authentication middleware
- Flask-Session 0.8.0 - Server-side session storage (filesystem)
- Flask-SQLAlchemy 3.1.1 - ORM integration wrapper

**Data / AI (Backend):**
- pandas 2.3.3 - DataFrame manipulation in `Core/app/services/excel_service.py`, `code_execution_service.py`
- numpy 2.3.5 - Numerical operations in `Core/app/services/excel_service.py`
- plotly 6.5.0 (backend) - Chart figure generation in `Core/app/services/code_execution_service.py`
- google-generativeai 0.8.6 - Gemini API SDK in `Core/app/services/llm_service.py`
- openpyxl 3.1.5 - Excel file read/write (used by pandas under the hood)

**Frontend Data / Charts:**
- plotly.js 3.3.1 - Chart rendering engine
- react-plotly.js 2.6.0 - React wrapper for Plotly (`src/Components/ChartViewer.tsx`)
- react-data-grid 7.0.0-beta.47 - Spreadsheet grid component (`src/Pages/Dashboard.tsx`)
- xlsx 0.18.5 - Excel parsing on the client side (available, imported when needed)

**UI Utilities:**
- lucide-react 0.554.0 - Icon library (`src/Pages/Dashboard.tsx`, `src/Components/`)
- sonner 2.0.7 - Toast notification system (`src/Pages/Dashboard.tsx`)

**Build / Dev:**
- Vite 7.2.4 - Build tool and dev server (`vite.config.ts`)
- @vitejs/plugin-react-swc 4.2.2 - SWC-based React fast refresh
- ESLint 9.39.1 - Linting (`eslint.config.js`)
- typescript-eslint 8.46.4 - TypeScript-aware ESLint rules

## Key Dependencies

**Critical:**
- `google-generativeai` 0.8.6 - Core AI feature; LLM code generation would fail without `GEMINI_API_KEY`
- `Flask-JWT-Extended` 4.7.1 - All `/excel/*` endpoints are JWT-protected; auth breaks without `JWT_SECRET_KEY`
- `SQLAlchemy` 2.0.44 + `PyMySQL` 1.1.2 - Persistent storage of users, conversations, and commands
- `pandas` 2.3.3 - All DataFrame transformation and chart generation depends on this

**Infrastructure:**
- `Gunicorn` 23.0.0 - Production WSGI server (used in `Core/DockerFile` CMD)
- `python-dotenv` 1.2.1 - Loads `.env` variables at startup in `Core/app/__init__.py`
- `Werkzeug` 3.1.3 - Password hashing (`generate_password_hash`/`check_password_hash`) in `Core/app/models/user.py`
- `cryptography` 46.0.3 - Underlying cryptography for JWT signing

## Configuration

**Environment (Backend):**
- Config loaded from `Core/.env` via `python-dotenv` at app startup
- Required vars: `JWT_SECRET_KEY`, `GEMINI_API_KEY`
- Optional: `FLASK_ENV`, `FLASK_DEBUG`
- Template available at `Core/.env.example`
- Session type: filesystem (stored in `Core/flask_session/`)

**Database (Backend):**
- Connection string hardcoded in `Core/config/database.py`: `mysql+pymysql://root:...@localhost:3306/DataMind_DB`
- Connection pool: `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`

**Build (Frontend):**
- TypeScript config: `tsconfig.app.json` (strict mode, ES2022 target, bundler module resolution)
- Vite config: `vite.config.ts` (React SWC plugin + Tailwind CSS plugin)
- ESLint config: `eslint.config.js` (react-hooks + react-refresh rules)

**Frontend API Base URL:**
- Hardcoded as `http://localhost:5000` in `src/Pages/Dashboard.tsx` and likely `src/Components/ChatBox.tsx`
- No environment variable abstraction for API base URL

## Platform Requirements

**Development:**
- Node.js (for Vite/npm tooling)
- Python 3.12
- MySQL server running at `localhost:3306` with database `DataMind_DB`
- `GEMINI_API_KEY` env var set in `Core/.env`

**Production:**
- Docker + Docker Compose (`docker-compose.yml`)
- Backend containerized via `Core/DockerFile` using `python:3.12-slim`
- Backend exposed on port 5000
- Frontend: not yet containerized (noted as optional future addition in `docker-compose.yml`)
- MySQL database: not containerized (expected as external service or future addition)

---

*Stack analysis: 2026-03-06*
