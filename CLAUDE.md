# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (host: true, accessible on LAN)
npm run build      # Production build
npm run preview    # Preview production build
npm run check      # Svelte/TypeScript type checking
npm run lint       # Prettier + ESLint
npm run format     # Auto-format with Prettier
```

No test suite is configured.

## Architecture

**Stack:** Svelte 5 (runes) + SvelteKit 2, client-side only (`ssr = false`), Vite 7. Target: mobile browsers, max-width 480px.

**Backend:** InvenTree REST API at `https://inventree.fueg.ch` (configured in `src/lib/config/app.js`). Full OpenAPI spec in `docs/InvenTree API.yaml`. Auth is token-based, token stored in localStorage.

### Layer separation

| Layer | Location | Responsibility |
|-------|----------|----------------|
| API | `src/lib/api/` | Raw InvenTree calls + response normalization |
| State | `src/lib/state/` | Svelte 5 `$state` runes, persisted to localStorage |
| Routes | `src/routes/` | Page composition only — thin, no business logic |
| Components | `src/lib/components/` | Reusable UI, props-only, no direct API calls |

### State modules (`src/lib/state/`)

- **auth.svelte.js** — token, username, serverUrl → `inventree-auth` localStorage key
- **workbench.svelte.js** — active build order context (id, ref, WIP location, work qty) → 5 localStorage keys (`active_bo_*`, `active_wip_*`, `active_work_qty`)
- **theme.svelte.js** — dark/light toggle → `theme` localStorage key

### API modules (`src/lib/api/`)

- **client.js** — `apiFetch()` wrapper: adds Token auth header, 15s timeout, normalizes Django REST Framework errors
- **auth.js** — `loginToInvenTree()`: Basic auth → `/api/user/token/`
- **builds.js** — All build order, BOM, output, stock, and allocation operations. `mapBuildOrder()` normalizes status codes (10=pending, 20=in_progress, 30=on_hold, 40=cancelled, 50=complete).

### Routing

```
/login              Authentication
/orders             Build order work queue (main entry)
/workbench          Active build order workspace (disabled nav if no order selected)
/workbench/[unitId] Unit detail (hides bottom nav)
/inventory          Stock browsing
```

The root `/` redirects to `/orders`. Auth guard lives in `src/routes/+layout.svelte` — unauthenticated users are redirected to `/login` via `$effect`.

### Navigation

`AppShell.svelte` wraps all pages and conditionally renders `BottomNav.svelte`. The nav hides on `/login` and `/workbench/[unitId]` paths. The Workbench tab is disabled when no build order is active (checked via `workbench.buildOrderId`).

## Design System

CSS custom properties are defined in `src/routes/+layout.svelte`. Design language is "Tonal Brutalism": deep navy/slate surfaces, Space Grotesk headings, Inter body, Safety Orange (`#FF6B00`) accent.

Fonts load via Google Fonts in `src/app.html`. Theme detection script in `<head>` reads localStorage before render to avoid flash.

## Domain Concepts

This app supports InvenTree manufacturing workflows for warehouse technicians:

- **Build Order** — a manufacturing job with BOM, outputs, and tracked allocations
- **WIP Bucket** — a physical stock location used as a staging area for in-progress work
- **Unit/Output** — a single item being produced (tracked components allocated per-output; bulk components allocated per-BOM-line)
- **Workbench** — the central workspace tied to one active build order at a time

The `GEMINI.md` file (~2800 lines) contains detailed product specifications including workflow rules, material handling rules, and architectural mandates — consult it for domain-level decisions.
