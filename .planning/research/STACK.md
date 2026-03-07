# Stack Research

**Domain:** AI-powered Excel editor (brownfield — React + TypeScript + Python Flask)
**Researched:** 2026-03-06
**Confidence:** MEDIUM (web search unavailable; findings grounded in codebase analysis + training knowledge; flagged where external verification is needed)

---

## Context: What Already Exists

The codebase is not greenfield. Before making any recommendation, the current state must be understood:

| Layer | Current Technology | Status |
|-------|--------------------|--------|
| Frontend framework | React 18.3.1 + TypeScript 5.9.3 + Vite 7.2.4 | Keep |
| Backend framework | Flask 3.1.2 + Python 3.12 | Keep (migration to FastAPI is optional but recommended — see below) |
| Excel parsing (backend) | pandas 2.3.3 via `pd.read_excel()` + openpyxl 3.1.5 as engine | Extend |
| Excel rendering (frontend) | react-data-grid 7.0.0-beta.47 (grid view only) | Replace or extend |
| AI integration | google-generativeai 0.8.6 (Gemini only) | Replace with LiteLLM |
| File storage | Local disk (`Core/uploads/{user_id}/`) | Extend with TTL cleanup |
| Streaming | None — synchronous HTTP request/response | Add SSE |

---

## Recommended Stack (Additions and Changes)

### 1. Excel Parsing — Backend

**Recommendation: Keep openpyxl 3.1.5, extend its usage beyond pandas**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| openpyxl | 3.1.5 (already installed) | Read/write .xlsx with formula strings, named ranges, cell styles | Pure Python, no OS dependencies, actively maintained, the only mature pure-Python library that handles the full .xlsx spec including formula strings and chart objects |
| pandas | 2.3.3 (already installed) | DataFrame-level data manipulation | Already in use; openpyxl is pandas' default engine for .xlsx; keep for data transforms |

**Confidence: HIGH** — openpyxl is the de facto standard for Python .xlsx I/O. It is already installed and in use.

**Why NOT the alternatives:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| xlwings | Requires a running Excel application instance (COM automation on Windows, AppleScript on Mac); impossible in a Linux Docker container | openpyxl |
| xlrd | Read-only; no write support; dropped .xlsx support in v2.0 (only reads legacy .xls) | openpyxl |
| xlsxwriter | Write-only; cannot read existing files — useless for edit-in-place | openpyxl for reading; acceptable for write-only export use cases |
| pyxlsb | Only reads .xlsb (binary format); irrelevant here | openpyxl |

**Critical limitation of openpyxl to understand:**
openpyxl reads formula strings (e.g., `=SUM(A1:A10)`) as stored text — it does NOT evaluate them. If the AI writes a formula string into a cell and you save the file, Excel will recalculate it when opened. For in-browser preview, the formula result will be blank until Excel recalculates. This is acceptable for v1 because the download-and-open workflow is the truth source. Do NOT attempt server-side formula evaluation (that path leads to implementing a spreadsheet engine).

**What openpyxl CAN do that the current code does NOT use:**
- Write formula strings to cells: `ws['B2'] = '=SUM(A1:A10)'`
- Preserve existing chart objects when copying worksheets
- Write chart definitions (BarChart, LineChart, etc.) programmatically
- Preserve named ranges, cell styles, merged cells, data validation

**Action required:** Extend `excel_service.py` to use openpyxl directly for formula-writing and chart-creation operations, rather than routing all edits through pandas DataFrame manipulation + `exec()`.

---

### 2. Excel Rendering — Frontend

**Recommendation: Replace react-data-grid with Luckysheet (via fortune-sheet) OR keep react-data-grid for v1 and add xlsx client-side parsing**

The frontend currently uses `react-data-grid` (7.0.0-beta.47) which is a generic data grid — it does not understand Excel concepts (formulas, merged cells, column widths from the file). The `xlsx` library (SheetJS Community Edition 0.18.5) is already installed in package.json.

**Option A — Minimal (recommended for v1): Keep react-data-grid + use SheetJS for parsing**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| xlsx (SheetJS CE) | 0.18.5 (already installed) | Parse .xlsx in the browser to extract cell values + formula strings for display | Already installed; covers read-only display without a new dependency |
| react-data-grid | 7.0.0-beta.47 (already installed) | Render cell data as a grid | Already integrated; sufficient for v1 (view-only, no in-cell editing) |

**Limitation:** SheetJS CE 0.18.5 is intentionally version-pinned at 0.18.5 in the community edition. SheetJS changed its licensing model — versions above 0.18.5 moved to a commercial license (SheetJS Pro). The community edition (0.18.5) remains MIT-licensed and handles .xlsx parsing adequately for display. Do not upgrade past 0.18.5 without checking the license.

**Confidence: MEDIUM** — SheetJS licensing change is well-documented; version pinning is intentional.

**Option B — Full (recommended if v1 scope includes formula display): fortune-sheet**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| fortune-sheet | ~0.2.x | React-native Excel-like grid with formula rendering, merged cells, chart display | Fork of Luckysheet rewritten as proper React components; supports formula evaluation in-browser, merged cells, frozen panes |

**Confidence: LOW** — fortune-sheet is community-maintained and its production readiness for complex files is unverified without testing. Verify bundle size and rendering performance before committing.

**What NOT to use:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| handsontable | Commercial license required for most production use cases; free tier is restrictive | fortune-sheet or react-data-grid |
| ag-grid (Community) | Generic data grid, no Excel semantics, formula display requires custom cell renderers | react-data-grid (simpler) |
| react-spreadsheet | Lightweight but no formula evaluation, no chart support, limited styling | fortune-sheet if formulas needed |
| Luckysheet (original) | Abandoned; last release 2021; fortune-sheet is the maintained successor | fortune-sheet |

**Recommendation for v1:** Use SheetJS 0.18.5 (already installed) to parse the .xlsx on the client after each AI change, and pass the cell data to react-data-grid for display. This is minimal-risk, uses existing dependencies, and covers the view-only requirement. Defer fortune-sheet to v2 if formula display in-browser becomes required.

---

### 3. AI Streaming — SSE vs WebSockets

**Recommendation: Server-Sent Events (SSE)**

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| SSE (Flask: `flask` streaming response with `text/event-stream`) | Stream AI token output from backend to frontend | Unidirectional push over HTTP; simpler than WebSockets; works through standard HTTP/1.1; no upgrade handshake; native browser `EventSource` API; reconnect is automatic |

**Confidence: HIGH** — SSE is the standard pattern for AI chat streaming (it is how the OpenAI, Anthropic, and Google APIs stream responses). The protocol matches the use case exactly: server pushes, client receives.

**Why NOT WebSockets for this use case:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| WebSockets | Bidirectional protocol; adds complexity (connection lifecycle management, heartbeats, disconnect handling) for a use case that is inherently one-directional (server streams tokens to browser); Flask-SocketIO adds a significant dependency | SSE for streaming; regular HTTP POST for sending prompts |

**Implementation pattern for Flask:**

```python
# Flask SSE streaming endpoint
from flask import Response, stream_with_context

@excel_bp.route('/transform/stream', methods=['POST'])
@jwt_required()
def transform_stream():
    def generate():
        for chunk in llm_service.stream_response(prompt):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
    return Response(stream_with_context(generate()), mimetype='text/event-stream')
```

```typescript
// Frontend EventSource consumption
const es = new EventSource('/excel/transform/stream');
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.done) { es.close(); return; }
  appendToMessage(data.chunk);
};
```

**Flask vs FastAPI for streaming:** Flask's streaming support works but requires `stream_with_context` and Gunicorn's sync worker model can limit concurrency. FastAPI with `StreamingResponse` and async generators is cleaner and handles concurrent requests better. If streaming becomes a performance bottleneck, migrating the `/transform` endpoint to FastAPI is the highest-leverage change. For v1, Flask streaming is sufficient.

**Confidence: HIGH** — Flask streaming via `stream_with_context` is documented and production-proven.

---

### 4. Multi-Model AI Integration

**Recommendation: LiteLLM**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| litellm | latest stable (~1.x) | Unified API layer over 100+ LLM providers (OpenAI, Anthropic, Google, Mistral, etc.) | Single interface replaces model-specific SDKs; `litellm.completion()` and `litellm.acompletion()` mirror the OpenAI API shape; model switching is a one-line config change; supports streaming natively |

**Confidence: MEDIUM** — LiteLLM is widely adopted in the AI engineering community as of mid-2025. Version number requires verification via `pip index versions litellm` before pinning.

**Why LiteLLM over custom abstraction:**

The current code has `LLMService` as a class wrapping the Gemini SDK directly. Adding Claude and GPT-4 with a custom abstraction means maintaining provider-specific code, handling different API shapes (Anthropic uses `messages` with `max_tokens`; OpenAI uses `messages` with `max_tokens`; Gemini uses `GenerativeModel` with different response shapes). LiteLLM normalizes all of this.

**Why NOT alternatives:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Custom abstraction (current pattern) | Every new model requires new SDK integration, different error types, different streaming patterns | LiteLLM |
| LangChain | Massive dependency tree; opinionated abstractions that fight against simple use cases; LLM code generation (the current pattern) does not need chains or agents | LiteLLM for the routing layer |
| OpenRouter (API gateway) | External service dependency; adds latency; requires account management; loses local control over prompts | LiteLLM running in-process |

**LiteLLM migration pattern for current LLMService:**

```python
# Before (Gemini-specific)
import google.generativeai as genai
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content(prompt)

# After (LiteLLM — model is a config value)
import litellm
response = litellm.completion(
    model=os.getenv('LLM_MODEL', 'gemini/gemini-2.5-flash'),
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"},  # structured output
)
content = response.choices[0].message.content
```

Supported model strings: `"gpt-4o"`, `"claude-3-5-sonnet-20241022"`, `"gemini/gemini-2.5-flash"`, `"mistral/mistral-large-latest"`.

**Structured output note:** The current code uses Gemini's `response_mime_type: "application/json"` for structured output. LiteLLM passes `response_format={"type": "json_object"}` which works for OpenAI and newer Claude models. For Gemini via LiteLLM, JSON mode is supported. Verify `response_format` behavior per model when implementing — some models require it in the prompt instead.

---

### 5. File Storage with TTL

**Recommendation: Local disk with APScheduler-based cleanup (v1), upgrade to Redis + S3 presigned URLs (v2)**

**Current state:** Files are stored at `Core/uploads/{user_id}/{uuid}_{filename}` with no TTL enforcement. The `StateManager` hard-caps conversations at 2 per user but never deletes the files.

**V1 Recommendation — APScheduler for scheduled cleanup:**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| APScheduler | ~3.10.x | Background job scheduler running inside Flask process | Lightweight; no new infrastructure; runs a periodic cleanup job that deletes files older than N hours; integrates with Flask app startup |

```python
# In create_app() or a dedicated scheduler setup
from apscheduler.schedulers.background import BackgroundScheduler

def cleanup_old_files():
    cutoff = datetime.utcnow() - timedelta(hours=24)
    for conv in db.session.query(Conversation).filter(Conversation.created_at < cutoff).all():
        if os.path.exists(conv.file_path):
            os.remove(conv.file_path)
        db.session.delete(conv)
    db.session.commit()

scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_old_files, 'interval', hours=1)
scheduler.start()
```

**Confidence: HIGH** — APScheduler is stable, widely used, and appropriate for this scale.

**Why NOT Redis for v1:**

Redis adds operational complexity (new container, connection management, persistence config). For v1 with a small user base and local disk storage, APScheduler achieves the TTL requirement without infrastructure changes.

**V2 path (when multi-server deployment is needed):**

| Technology | Purpose | When to adopt |
|------------|---------|---------------|
| AWS S3 + presigned URLs | Store files in object storage; generate time-limited download URLs; use S3 lifecycle rules for TTL deletion | When horizontal scaling beyond single server is needed |
| Redis (for session state) | Replace MySQL-based conversation state with Redis hashes + TTL | When session read/write latency becomes a bottleneck |

---

## Supporting Libraries (New Additions)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| litellm | latest stable | Multi-model LLM routing | Immediately — replaces google-generativeai direct usage |
| apscheduler | ~3.10.x | File TTL cleanup scheduler | Immediately — enforces upload TTL |
| anthropic | latest stable | Anthropic SDK (used by LiteLLM internally, may need explicit install) | When adding Claude; LiteLLM pulls it transitively |
| openai | ~1.x | OpenAI SDK (used by LiteLLM internally) | When adding GPT-4; LiteLLM pulls it transitively |
| python-multipart | latest | Multipart form parsing for file uploads in async context | If migrating to FastAPI |

---

## Installation

```bash
# Backend — add to Core/requirements.txt (pin after verifying latest)
pip install litellm
pip install apscheduler

# Verify exact versions for pinning
pip show litellm apscheduler
```

```bash
# Frontend — no new packages needed for v1 (xlsx and react-data-grid already present)
# If upgrading to fortune-sheet in v2:
npm install fortune-sheet
npm install @fortune-sheet/react
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| LiteLLM | Custom multi-model abstraction | Only if LiteLLM's dependency size is unacceptable in the container or if you need provider-specific features LiteLLM doesn't expose |
| SSE | WebSockets | When bidirectional real-time communication is needed (e.g., collaborative editing, live cursor positions) — not needed for v1 |
| openpyxl | xlwings | Only if the server runs on Windows with Excel installed — impossible in Docker/Linux |
| APScheduler | Redis TTL + Celery | When background jobs need reliability guarantees, retry logic, distributed execution |
| react-data-grid + SheetJS | fortune-sheet | When in-browser formula evaluation or Excel-faithful rendering is a hard requirement |
| Flask (keep) | FastAPI migration | FastAPI's async support makes streaming cleaner; migrate the `/transform` route if concurrent streaming becomes a bottleneck |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| xlwings | Requires Excel COM/AppleScript; breaks in Docker/Linux; impossible in production | openpyxl |
| xlrd > 2.0 | Dropped .xlsx support; only reads legacy .xls binary format | openpyxl |
| SheetJS > 0.18.5 | Commercial license required above this version | Pin at 0.18.5 (already done) |
| handsontable | Commercial license for production; free tier has feature restrictions | react-data-grid or fortune-sheet |
| Luckysheet (original) | Abandoned since 2021; no React support; security vulnerabilities unpatched | fortune-sheet (the maintained React fork) |
| LangChain | Over-engineered for the code-generation pattern used here; adds 50+ transitive dependencies; abstraction fights against direct prompt control | LiteLLM for routing only |
| WebSockets (for streaming) | Bidirectional protocol adds complexity; SSE is sufficient for token streaming | SSE |
| google-generativeai (direct) | Single-vendor lock-in; requires SDK swap for each new model; different API shape per provider | LiteLLM wrapper |

---

## Stack Patterns by Variant

**If formula display in the browser is required in v1:**
- Add fortune-sheet instead of react-data-grid
- Because fortune-sheet evaluates formula strings client-side using HyperFormula
- Risk: Bundle size increase (~500KB+); verify performance with large sheets

**If Claude becomes the primary model:**
- Set `LLM_MODEL=claude-3-5-sonnet-20241022` in environment
- LiteLLM handles the API shape difference transparently
- Anthropic requires `max_tokens` to be set explicitly — pass via `litellm.completion(max_tokens=4096)`

**If the backend migrates from Flask to FastAPI:**
- `StreamingResponse` with `async_generator` replaces `stream_with_context`
- LiteLLM's `acompletion()` (async) fits naturally into FastAPI async routes
- APScheduler works with both Flask and FastAPI

**If multi-user concurrency becomes a bottleneck:**
- Replace Flask's sync Gunicorn workers with FastAPI + Uvicorn async workers
- This is the single highest-leverage architectural change for scaling

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| openpyxl 3.1.5 | pandas 2.3.3 | openpyxl is pandas' default .xlsx engine; no config needed |
| litellm latest | Python 3.12 | Verify with `pip install litellm` in Python 3.12 environment before pinning |
| APScheduler 3.10.x | Flask 3.1.2 | Use `BackgroundScheduler` (not `AsyncIOScheduler`) with Flask's sync model |
| SheetJS 0.18.5 | React 18.3.1 | Already installed; do NOT upgrade past 0.18.5 |
| fortune-sheet (if adopted) | React 18.3.1 | Verify peer deps; fortune-sheet requires React 17+ |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| openpyxl recommendation | HIGH | Already installed; codebase confirmed; well-known limitations documented |
| SheetJS version lock | HIGH | Licensing change is public knowledge; 0.18.5 already pinned in package.json |
| SSE for streaming | HIGH | Textbook pattern for LLM token streaming; matches Flask's streaming API |
| LiteLLM recommendation | MEDIUM | Widely adopted as of training cutoff; exact version requires `pip show litellm` verification |
| fortune-sheet readiness | LOW | Community-maintained; production readiness for complex sheets unverified without testing |
| APScheduler for TTL | HIGH | Stable library; pattern is standard; no external dependencies |

---

## Open Questions (Require Validation)

1. **LiteLLM version to pin:** Run `pip install litellm && pip show litellm` in the Python 3.12 environment to get current stable version before adding to requirements.txt.
2. **fortune-sheet bundle size:** If fortune-sheet is considered, measure bundle impact with `npm run build` before committing.
3. **Flask streaming with Gunicorn:** Verify that the current Gunicorn worker configuration (sync workers) correctly streams SSE responses without buffering. May need `--worker-class gevent` or response buffering disabled.
4. **LiteLLM structured output with Gemini:** Test `response_format={"type": "json_object"}` with Gemini via LiteLLM — Gemini's JSON mode behavior through LiteLLM may differ from the direct SDK's `response_mime_type` approach.

---

## Sources

- Codebase analysis (`Core/requirements.txt`, `package.json`, `Core/app/services/`) — HIGH confidence; direct observation
- `Core/app/services/llm_service.py` — confirmed single-model Gemini implementation, validates migration need
- `Core/app/services/excel_service.py` — confirmed pandas + openpyxl usage pattern
- openpyxl documentation knowledge (training data, pre-cutoff) — MEDIUM confidence; verify formula/chart API at openpyxl.readthedocs.io
- LiteLLM (training data, pre-cutoff) — MEDIUM confidence; verify current version
- SheetJS CE licensing change (training data, pre-cutoff) — MEDIUM confidence; verify at sheetjs.com
- SSE pattern (training data) — HIGH confidence; standard HTTP streaming pattern, implementation is deterministic

---
*Stack research for: AI-powered Excel editor (DataMind)*
*Researched: 2026-03-06*
