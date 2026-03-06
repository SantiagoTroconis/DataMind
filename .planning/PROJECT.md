# DataMind

## What This Is

DataMind es un editor de archivos Excel potenciado por IA donde cualquier persona puede modificar sus hojas de cálculo a través de lenguaje natural en un chat. El usuario sube su archivo, describe lo que quiere hacer ("crea una fórmula que sume las ventas por región", "agrégame un gráfico de barras"), y el archivo se actualiza en tiempo real frente a sus ojos. El objetivo es que cualquier persona — sin importar su nivel técnico — pueda ser un experto en Excel.

## Core Value

El flujo completo funciona: subir archivo Excel → chatear con IA → ver cambios en vivo → descargar resultado.

## Requirements

### Validated

- ✓ Landing page con presentación del producto — existing
- ✓ Componente de chat (UI base) — existing
- ✓ Componentes de gráficos (visualización) — existing

### Active

**Autenticación**
- [ ] El usuario puede registrarse con email y contraseña
- [ ] El usuario puede iniciar sesión y mantener su sesión activa
- [ ] El usuario puede recuperar su contraseña por email

**Editor Excel**
- [ ] El usuario puede subir un archivo .xlsx o .xls
- [ ] El usuario ve el contenido de su Excel renderizado en pantalla (vista de hoja)
- [ ] El layout muestra el chat a un lado y la vista del Excel al otro
- [ ] Los cambios solicitados por chat se reflejan en la vista del Excel en tiempo real

**Chat con IA**
- [ ] El usuario escribe en lenguaje natural qué cambios quiere hacer
- [ ] La IA interpreta el pedido y aplica los cambios al archivo (celdas, fórmulas, gráficos)
- [ ] El sistema soporta múltiples modelos de IA (Claude, GPT-4, etc.) de forma intercambiable
- [ ] El historial del chat se preserva durante la sesión

**Operaciones Excel soportadas**
- [ ] Editar valores de celdas ("cambia el valor de B3 a 500")
- [ ] Crear y editar fórmulas ("agrega una fórmula que sume la columna C")
- [ ] Crear y editar gráficos desde los datos ("crea un gráfico de barras con las ventas")

**Sesiones y archivos**
- [ ] El usuario autenticado puede volver a una conversación previa y ver su archivo
- [ ] El archivo modificado está disponible por un tiempo limitado en la sesión
- [ ] El usuario puede descargar el archivo .xlsx con todos los cambios aplicados
- [ ] Se muestra un botón de descarga claro tras cada modificación

### Out of Scope

- Soporte para Google Sheets o archivos .csv — enfoque en Excel (.xlsx/.xls) para v1
- Colaboración en tiempo real entre múltiples usuarios — demasiada complejidad para v1
- App móvil — web-first
- Formato y estilos (colores, bordes, fuentes) — diferido a v2, no es core del valor
- Editor de Excel propio (type-in-cell) — el usuario edita solo por chat, no directamente en la hoja

## Context

El repositorio ya tiene código existente: una landing page, componentes de chat (UI base), y visualización de gráficos con Recharts. El stack es React + TypeScript en frontend y Python (FastAPI) en el backend, con Docker para el despliegue.

La visión del producto es democratizar el acceso a Excel: que una persona que nunca aprendió VLOOKUP pueda pedirlo en español y tenerlo funcionando. El usuario target va desde el dueño de negocio que lleva sus cuentas en Excel hasta el profesional que quiere ir más rápido.

La IA actúa como intérprete: convierte lenguaje natural en operaciones concretas sobre el archivo (modificar celdas, crear fórmulas, generar gráficos) y devuelve el archivo actualizado.

## Constraints

- **Tech Stack**: React + TypeScript (frontend), Python FastAPI (backend) — continuar con el stack existente
- **Modelos IA**: Arquitectura multi-modelo desde el inicio (Claude, GPT-4 como mínimo)
- **Formato de archivo**: Solo .xlsx / .xls en v1
- **Almacenamiento**: Archivos con TTL definido (no almacenamiento permanente en v1)
- **Auth**: Requerida para persistir sesiones y acceso al historial de conversaciones

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-modelo desde v1 | El usuario o admin puede cambiar el modelo; evita lock-in | — Pending |
| Auth requerida para sesiones | El usuario necesita volver a su conversación y archivo | — Pending |
| Chat + preview en split layout | La visualización en tiempo real es central al valor del producto | — Pending |
| Solo lectura/edición vía chat (no edición directa) | Simplifica v1 y refuerza el differentiator de IA | — Pending |

---
*Last updated: 2026-03-06 after initialization*
