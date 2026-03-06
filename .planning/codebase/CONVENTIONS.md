# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- Pages use PascalCase: `Dashboard.tsx`, `Auth.tsx`, `Register.tsx`, `NotFound.tsx`, `Landing.tsx`, `AboutUs.tsx`
- Components use PascalCase: `ChatBox.tsx`, `ChartViewer.tsx`, `Navbar.tsx`, `Footer.tsx`, `CodePreview.tsx`
- Directories use PascalCase: `src/Pages/`, `src/Components/`
- CSS file is lowercase: `src/index.css`

**Functions / Components:**
- React components exported as named exports using `export const` (arrow functions): `export const Auth = () => { ... }`
- Exception: `Dashboard` and `Landing` use default function exports: `export default function Landing()` / `export default Dashboard`
- Event handler functions prefixed with `handle`: `handleSend`, `handleFileUpload`, `handleLogout`, `handleReset`, `handleDelete`, `handleSignIn`, `handleChange`
- Boolean state variables prefixed with `is`: `isOpen`, `isLoading`, `isUploading`
- Callback props prefixed with `on`: `onOpenChange`, `onUpdateFile`, `onUpdateGrid`, `onChartGenerated`, `onClose`, `onSwitchToLogin`

**Variables:**
- camelCase throughout: `formData`, `gridData`, `chartData`, `sessionId`, `activeConversationId`
- State setters always follow `set` + PascalCase: `setFormData`, `setGridData`, `setChartData`

**Types / Interfaces:**
- PascalCase interfaces: `Message`, `User`, `Conversation`, `ChatBoxProps`, `ChartViewerProps`, `RegisterProps`
- Interfaces declared with `interface` keyword, not `type`
- Interfaces are colocated with the component that owns them; shared interfaces are exported from the owning page (e.g. `Message` exported from `src/Pages/Dashboard.tsx`)

**Constants:**
- SCREAMING_SNAKE_CASE for module-level constant arrays/objects: `QUICK_ACTIONS`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is enforced informally
- 2-space indentation in most files; 4-space used inside `src/Components/ChatBox.tsx` and `src/Components/ChartViewer.tsx`
- Single quotes for imports in most files; double quotes appear inconsistently in JSX attribute strings
- Trailing commas present in object/array literals

**Linting:**
- ESLint 9 with flat config at `eslint.config.js`
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` vite preset
- Targets `**/*.{ts,tsx}` only
- `dist/` directory is globally ignored

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.app.json`)
- `noUnusedLocals` and `noUnusedParameters` are enabled
- `noEmit`: true (build via Vite, not tsc emit)
- `verbatimModuleSyntax`: true — requires `import type` for type-only imports
- `as any` is used as an escape hatch in `src/Components/ChartViewer.tsx` and `src/Pages/Dashboard.tsx` when dealing with untyped Plotly trace shapes

## Import Organization

**Order (observed pattern):**
1. React and React ecosystem (`react`, `react-dom`, `react-router-dom`)
2. Third-party libraries (`plotly.js`, `lucide-react`, `sonner`, `react-data-grid`, `react-plotly.js`)
3. Internal pages and components (`../Pages/Dashboard`, `../Components/ChatBox`)
4. CSS (`./index.css`, `react-data-grid/lib/styles.css`)

**Path Aliases:**
- None detected. All internal imports use relative paths (`../Components/...`, `../Pages/...`)

**Type-only imports:**
- `import type { Dispatch, SetStateAction } from 'react'` — verbatimModuleSyntax enforces this for type-only imports
- `import { type Data } from 'plotly.js'` — inline `type` modifier used for type imports mixed with value imports

## Error Handling

**Patterns:**
- All async API calls are wrapped in `try/catch/finally`
- `catch` blocks log via `console.error(...)` and optionally show a `toast.error(...)` to the user
- `finally` blocks reset loading states (e.g., `setIsLoading(false)`, `setIsUploading(false)`, `setAppState('view')`)
- HTTP errors are detected with `if (!response.ok) { throw new Error(...) }` before reading the response body
- NaN values from API JSON are sanitized before parsing: `textText.replace(/:\s*NaN/g, ': null')` in `src/Pages/Dashboard.tsx` and `src/Components/ChatBox.tsx`
- Error messages shown to users via `sonner` toast: `toast.error('...')`, `toast.success('...')`, `toast.info('...')`
- Confirmation-required destructive actions use `toast(...)` with `action` and `cancel` callbacks (see `handleReset`, `handleDelete`, `handleCloseChart` in `src/Pages/Dashboard.tsx`)

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- `console.error(label, error)` used in all catch blocks
- `console.log(data)` appears in `src/Pages/Auth.tsx` line 43 (debug log left in production code — not a pattern to follow)
- No structured logging; logs are informal and developer-oriented

## Comments

**When to Comment:**
- Inline comments used sparingly to label JSX sections: `{/* Data Grid Panel */}`, `{/* Chart Panel */}`, `{/* Initial Loading State */}`
- Logic comments used when intent is non-obvious: `// Add BOM for better Excel compatibility`, `// If metadata missing, attempt to infer from existing trace.x / trace.y`
- One emoji comment present in `src/Pages/Register.tsx` line 54: `// 🔹 Si está vacío, no hay error` (bilingual — Spanish comment in an otherwise English codebase)

**JSDoc/TSDoc:**
- Not used. No JSDoc annotations anywhere in the codebase.

## Function Design

**Size:** Functions are large and co-located in the component that uses them. `Dashboard` contains 10+ handler functions and all rendering logic in a single ~715-line file.

**Parameters:** Props are destructured at the function signature level for components. Standalone utility functions use positional arguments.

**Return Values:**
- Components return JSX or `null` (e.g. `if (!chartData) return null` in `src/Components/ChartViewer.tsx`)
- Utility functions return typed values: `generateCsvFile` returns `File`, `findColumnByValues` returns `string | null`

## Module Design

**Exports:**
- Named exports are the dominant pattern: `export const Navbar`, `export const Auth`, `export const ChatBox`, `export const ChartViewer`, `export const Footer`, `export const NotFound`, `export const Register`
- Default exports used only for `Dashboard` and `Landing`
- Interfaces shared across components are exported from their origin page: `export interface Message`, `export interface User`, `export interface Conversation` from `src/Pages/Dashboard.tsx`

**Barrel Files:**
- Not used. Each module is imported by its direct path.

## State Management

**Pattern:** All state is local React `useState`. No global state library (no Redux, Zustand, Context API, etc.).

- `sessionStorage` is used for `current_session_id` across navigations
- `localStorage` is used for `token` and `user` auth data
- State is lifted to the `Dashboard` parent and passed down via props to `ChatBox` and `ChartViewer`

---

*Convention analysis: 2026-03-06*
