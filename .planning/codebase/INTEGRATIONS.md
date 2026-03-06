# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**AI / LLM:**
- Google Gemini (`gemini-2.5-flash` model) - Generates Python transformation and Plotly chart code from natural language prompts
  - SDK/Client: `google-generativeai` 0.8.6 (`Core/app/services/llm_service.py`)
  - Auth: `GEMINI_API_KEY` environment variable (read via `os.getenv` in `Core/app/services/llm_service.py`)
  - Response format: JSON (`response_mime_type: "application/json"`)
  - Called in: `Core/app/services/llm_service.py` → `LLMService.generate_transformation_code()`
  - Triggered by: `POST /excel/transform` in `Core/app/routes/excel.py`

## Data Storage

**Databases:**
- MySQL (local instance)
  - Connection: Hardcoded DSN in `Core/config/database.py`: `mysql+pymysql://root:...@localhost:3306/DataMind_DB?charset=utf8mb4`
  - Client/ORM: SQLAlchemy 2.0.44 with PyMySQL 1.1.2 driver
  - Models: `User` (`Core/app/models/user.py`), `Conversation` (`Core/app/models/conversation.py`), `Command` (`Core/app/models/command.py`)
  - Session factory: `SessionLocal` defined in `Core/config/database.py`
  - No migration tool detected (no Alembic config found)

**File Storage:**
- Local filesystem only
  - Uploaded files saved to `Core/uploads/{user_id}/{uuid}_{filename}`
  - Logic in `Core/app/services/excel_service.py` → `ExcelService.save_file_to_disk()`
  - Files persist across requests; read back via `pd.read_excel()` or `pd.read_csv()` in `Core/app/services/state_manager.py`

**Caching:**
- Flask-Session 0.8.0 with filesystem backend
  - Session files stored in `Core/flask_session/`
  - Configured in `Core/app/__init__.py`: `app.config["SESSION_TYPE"] = "filesystem"`

## Authentication & Identity

**Auth Provider:**
- Custom email/password authentication (no third-party OAuth provider)
  - Implementation: `Core/app/services/auth_services.py` → `AuthService.register()` / `AuthService.login()`
  - Password hashing: Werkzeug's `generate_password_hash` / `check_password_hash` in `Core/app/models/user.py`
  - Token issuance: Flask-JWT-Extended `create_access_token()` with 30-minute expiry
  - Token validation: `@jwt_required()` decorator on all `/excel/*` endpoints in `Core/app/routes/excel.py`
  - Secret: `JWT_SECRET_KEY` env var (falls back to insecure default if unset — see `Core/app/__init__.py`)

**Frontend token storage:**
- JWT stored in browser `localStorage` under key `"token"` (`src/Pages/Dashboard.tsx`)
- User info stored in `localStorage` under key `"user"`
- Active session ID stored in `sessionStorage` under key `"current_session_id"`
- Token sent as `Authorization: Bearer <token>` header on all API calls

**Auth endpoints:**
- `POST /login` → `Core/app/routes/auth.py`
- `POST /register` → `Core/app/routes/auth.py`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or similar SDK)

**Logs:**
- Python `print()` statements for error logging in `Core/app/services/llm_service.py` and `Core/app/routes/excel.py`
- No structured logging framework (no `logging` module configuration found)
- Frontend: `console.error()` in `src/Pages/Dashboard.tsx` and component files

## CI/CD & Deployment

**Hosting:**
- Backend: Docker container via `Core/DockerFile` (Python 3.12-slim, Gunicorn on port 5000)
- Frontend: Not containerized; built with `npm run build` to `dist/` folder
- Orchestration: `docker-compose.yml` at project root (backend service only; frontend listed as future addition)

**CI Pipeline:**
- None detected (no GitHub Actions, CircleCI, or similar config files)

## Environment Configuration

**Required environment variables (backend):**
- `JWT_SECRET_KEY` - JWT signing secret (critical; has insecure default fallback)
- `GEMINI_API_KEY` - Google Gemini API key (required; raises `ValueError` if missing)

**Optional environment variables:**
- `FLASK_ENV` - Flask environment mode (set to `development` in `docker-compose.yml`)
- `FLASK_DEBUG` - Debug mode toggle

**Secrets location:**
- Backend: `Core/.env` file (loaded by `python-dotenv`; listed in `Core/.gitignore`)
- Template: `Core/.env.example` (safe to commit, contains placeholder values only)

**Frontend API base URL:**
- Hardcoded as `http://localhost:5000` throughout `src/Pages/Dashboard.tsx`
- No `.env` file or Vite env variable abstraction for the API base URL

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (Gemini API is called synchronously via HTTP, not via webhooks)

## Internal API Surface (Frontend → Backend)

The frontend communicates exclusively with the Flask backend over REST HTTP. All endpoints are prefixed per blueprint registration.

**Auth endpoints (no JWT required):**
- `POST /login`
- `POST /register`

**Excel/data endpoints (JWT required):**
- `POST /excel/upload` - Upload spreadsheet file
- `POST /excel/transform` - Send natural language prompt; returns transformed data or chart JSON
- `POST /excel/undo` - Soft-delete last command
- `POST /excel/reset` - Soft-delete all commands for session
- `GET /excel/conversations` - List user's active conversations
- `GET /excel/conversation/<id>` - Load full conversation state (grid + chart + messages)
- `DELETE /excel/conversation/<id>` - Soft-delete a conversation

---

*Integration audit: 2026-03-06*
