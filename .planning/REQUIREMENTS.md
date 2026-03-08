# Requirements: DataMind

**Defined:** 2026-03-06
**Core Value:** El flujo completo funciona: subir archivo Excel → chatear con IA → ver cambios en vivo → descargar resultado.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: El usuario puede registrarse con email y contraseña
- [x] **AUTH-02**: El usuario puede iniciar sesión y mantener su sesión activa entre recargas
- [x] **AUTH-03**: El usuario autenticado puede acceder a sus conversaciones previas

### Security

- [x] **SEC-01**: El sandbox de ejecución de código generado por IA elimina `__builtins__` y restringe importaciones peligrosas
- [x] **SEC-02**: El sistema previene prompt injection validando y sanitizando el output del LLM antes de ejecutar
- [x] **SEC-03**: Las credenciales de modelos de IA (API keys) se gestionan como variables de entorno, nunca en el cliente

### File Management

- [x] **FILE-01**: El usuario puede subir un archivo .xlsx o .xls desde su computadora
- [x] **FILE-02**: El archivo subido tiene un TTL definido; se elimina automáticamente al expirar (disco + registro DB)
- [ ] **FILE-03**: El usuario puede descargar el archivo .xlsx con todos los cambios aplicados
- [ ] **FILE-04**: Se muestra un botón de descarga claro después de cada modificación

### Excel Editor

- [ ] **EDIT-01**: El contenido del archivo Excel se renderiza en pantalla como una vista de hoja (filas, columnas, celdas)
- [ ] **EDIT-02**: El layout muestra el chat a un lado y la vista del Excel al otro (split layout)
- [x] **EDIT-03**: El usuario puede pedir por chat cambios en valores de celdas y estos se reflejan en la vista en tiempo real
- [x] **EDIT-04**: El usuario puede pedir por chat crear o modificar fórmulas (SUM, IF, VLOOKUP, etc.) y estas se aplican correctamente al archivo

### AI Chat

- [x] **CHAT-01**: El sistema soporta múltiples modelos de IA (Claude y GPT-4 como mínimo) de forma intercambiable vía LiteLLM
- [x] **CHAT-02**: Tras cada cambio, la IA explica en lenguaje natural qué modificó y por qué
- [x] **CHAT-03**: El usuario puede deshacer el último cambio aplicado (undo)
- [x] **CHAT-04**: El historial del chat se preserva en la sesión y es visible al volver a la conversación

### Sessions

- [x] **SESS-01**: El usuario puede ver la lista de sus conversaciones anteriores
- [x] **SESS-02**: El usuario puede retomar una conversación anterior y ver el estado del archivo en ese punto

## v2 Requirements

### Charts

- **CHART-01**: El usuario puede crear gráficos de barras, línea o torta desde los datos por chat
- **CHART-02**: Los gráficos creados se renderizan en la vista del Excel en tiempo real
- **CHART-03**: El usuario puede modificar un gráfico existente por chat (tipo, colores, rango de datos)

### Authentication Extended

- **AUTH-04**: El usuario puede recuperar su contraseña por email
- **AUTH-05**: Login con OAuth (Google / GitHub)

### AI Extended

- **AI-01**: El usuario puede seleccionar qué modelo de IA usar desde la UI
- **AI-02**: La IA reconoce rangos con nombre y encabezados de columna para referencias naturales ("la columna Ventas")

### Formatting

- **FMT-01**: El usuario puede pedir cambios de formato por chat (colores, bordes, ancho de columnas)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Soporte para Google Sheets | Enfoque en .xlsx/.xls para v1; integración con APIs de Google es complejidad significativa |
| Soporte para archivos .csv | Diferente dominio; DataMind es Excel-first |
| Edición directa de celdas (click en la hoja) | El diferenciador es la IA; la edición directa compite con Excel mismo |
| Colaboración en tiempo real (multi-usuario) | Alta complejidad; no es core del valor para v1 |
| App móvil | Web-first; la UX de split layout requiere pantalla amplia |
| Tablas dinámicas (pivot tables) | openpyxl no puede crear pivot tables reales — limitación de librería |
| Almacenamiento permanente de archivos | Los archivos tienen TTL; no es un storage service |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| FILE-01 | Phase 1 | Complete |
| SEC-01 | Phase 2 | Complete |
| SEC-02 | Phase 2 | Complete |
| EDIT-03 | Phase 2 | Complete |
| EDIT-04 | Phase 2 | Complete |
| CHAT-01 | Phase 2 | Complete |
| CHAT-02 | Phase 2 | Complete |
| FILE-02 | Phase 3 | Complete |
| AUTH-03 | Phase 3 | Complete |
| CHAT-03 | Phase 3 | Complete |
| CHAT-04 | Phase 3 | Complete |
| SESS-01 | Phase 3 | Complete |
| SESS-02 | Phase 3 | Complete |
| EDIT-01 | Phase 4 | Pending |
| EDIT-02 | Phase 4 | Pending |
| FILE-03 | Phase 4 | Pending |
| FILE-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 — traceability populated after roadmap creation*
