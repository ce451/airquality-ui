# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Angular 20 web application for monitoring air quality stations. Displays real-time temperature, humidity, and absolute humidity measurements from multiple stations organized by groups, with WebSocket support for live updates and Chart.js visualizations.

## Commands

### Development
```bash
npm start                # Start dev server on 0.0.0.0:4200 with polling (for containers)
ng serve                 # Standard dev server on localhost:4200
npm run watch            # Build with watch mode (development config)
```

### Building
```bash
npm run build            # Production build (outputs to dist/)
```

### Testing
```bash
npm test                 # Run Karma unit tests
ng test                  # Same as npm test
```

### Code Generation
```bash
ng generate component component-name    # Generate new component (non-standalone by default)
ng generate service service-name        # Generate new service
ng generate --help                      # See all available schematics
```

## Architecture

### Project Structure

```
src/app/
├── core/                      # Singleton services and core models
│   ├── models/                # Data models (Station, Measurement, StationGroup)
│   └── services/              # Core services (HTTP, WebSocket, theme)
├── features/                  # Feature modules organized by page
│   └── pages/                 # Page components (Dashboard, StationDetail)
└── shared/                    # Reusable components, pipes, utilities
    ├── components/            # Shared components (StationCard, ThemeToggle)
    └── pipes/                 # Custom pipes (LastUpdatedPipe)
```

### Key Architectural Patterns

**Non-Standalone Components**: This project is configured to generate non-standalone components by default (see angular.json). Components use the traditional NgModule pattern rather than standalone APIs.

**Environment Configuration**:
- Production: `src/environments/environment.ts`
- Development: `src/environments/environment.development.ts`
- Path alias: `@environments/*` maps to `./src/environments/*`
- Environment switching via `fileReplacements` in angular.json

**Data Flow & Initial Load (SWR + batch)**:
1. **Initial Load**: the dashboard first paints the last successful snapshot from `DashboardCacheService` (localStorage, stale-while-revalidate), then `forkJoin`s TWO parallel requests: `GET /stationgroups` and the **batch** `GET /stations/measurements?minutes=60&maxPoints=150`. Cards receive their series via input and only self-fetch as a fallback (e.g. when the batch endpoint 404s on an older API — then the old per-card flow kicks in).
2. **Grouping Logic**: Stations are grouped by `stationGroupId` and sorted by `displayOrder` within each group
3. **Real-time Updates**: `WebSocketService` connects to `/ws` endpoint via SockJS/STOMP and subscribes to `/topic/measurements`
4. **Component Updates**: `StationCard` subscribes to filtered WebSocket stream for its specific station and updates chart data
5. **Navigation**: Dashboard cards use icon button in top-right corner for navigation (not whole-card clickable)

**WebSocket Architecture**:
- Service: `WebSocketService` (singleton; connects **lazily** via `ensureConnected()` when the first card subscribes — i.e. after the first grid paint — and runs the STOMP client **outside the Angular zone** so its heartbeat intervals don't block `ApplicationRef.isStable`/SW registration)
- Protocol: STOMP over SockJS
- Topic: `/topic/measurements` broadcasts all measurement updates
- Filtering: `streamForStation(id)` filters measurements by `stationId`
- Zone handling: All WebSocket callbacks use `NgZone.run()` to trigger change detection

**Chart Integration**:
- Library: `ng2-charts` (wrapper for Chart.js)
- Configuration: Multi-axis line charts with separate Y-axes for temperature, humidity, and absolute humidity
- Updates: Charts update via `chart?.update()` when new measurements arrive via WebSocket
- Responsive: Uses Angular CDK `BreakpointObserver` to track screen size (xs/sm/md/lg/xl/2xl)
- **Responsive Heights**: Detail page charts scale with screen width (320px mobile → 450px xl screens)
- **Compact Spacing**: Y-axes use `padding: 0` and `layout.padding.left: 0` to maximize chart area

### TypeScript Configuration

- **Strict Mode**: Enabled with `strict: true`
- **Path Mappings**:
  - `src/*` → `./src/*`
  - `@environments/*` → `./src/environments/*`
- **Target**: ES2022 with module preservation
- **Angular Compiler**: Strict templates, strict injection parameters, and host binding checks enabled

### Styling

- **Framework**: Tailwind CSS 4.x with PostCSS
- **Preprocessor**: SCSS for component styles
- **Global Styles**: `src/styles.scss`
- **Theme**: CSS variables for colors (e.g., `--color-temperature`, `--color-humidity`)
- **Theme Toggle**: `ThemeService` manages light/dark mode

### Backend Integration

**Same-origin via nginx proxy**: In production the app calls the API under its own
origin (`environment.apiBaseUrl = '/api'`); the UI container's `nginx.conf` strips
the `/api` prefix and proxies to `airquality_api:8080` (Docker network alias,
re-resolved at request time via Docker DNS). This avoids mixed content under HTTPS
and removes the CORS dependency. nginx also has **gzip enabled** (JSON + bundles;
the base image ships it off) — do not remove it, remote loads depend on it. Development (`environment.development.ts`) still
talks directly to `http://localhost:8080`.

The endpoint paths below are backend paths (prefixed with `/api` in production):

**REST Endpoints**:
- `GET /stations` - All stations (fallback path only)
- `GET /stations/measurements?minutes=X&maxPoints=N` - **Batch**: all stations incl. sampled series (dashboard: `minutes=60&maxPoints=150`)
- `GET /stations/latestMeasurement` - Stations with latest measurement (not currently used)
- `GET /stations/:id` - Single station
- `GET /stations/:id/measurements?minutes=X&maxPoints=N` - Station with sampled measurement history
  - Detail page filters: `60`, `180`, `1440`, `10080`, `43200` (1h, 3h, 24h, week, month), always `maxPoints=500`
- Measurement list entries are compact points (`temperature`, `humidity`, `absoluteHumidity`, `timestamp`) — no `id`/`voltage`; only WebSocket messages carry `id` + `stationId`.

**WebSocket**:
- Endpoint: `/ws` (production: `/api/ws` through the nginx proxy — WebSocket
  upgrade headers and unbuffered SockJS streaming are configured there)
- Topic: `/topic/measurements`
- Message format: JSON matching `Measurement` model

### Data Models

**Station**: Contains `id`, `name`, `ipAddress`, `status`, `stationGroupId`, `displayOrder`, and `measurements[]`

**Measurement**: Contains `id` (string UUID from backend), `stationId`, `temperature`, `humidity`, `absoluteHumidity`, `timestamp`

**StationGroup**: Groups for organizing stations with display ordering

## Features

### Time Filters (Detail Page)
- **Filter Options**: 1 Hour, 3 Hours, 24 Hours, Week (7 days), Month (30 days)
- **Default**: 24 Hours
- **Server-Side Filtering & Sampling**: queries the backend with `minutes` + `maxPoints=500`; the API downsamples the series server-side (evenly strided, newest+oldest kept). Client-side sampling was removed — it used to download the full series (month: ~9900 points / 1.7 MB raw) only to discard ~95% locally. The API additionally **thins older data destructively** (see "Measurement Frequency" below).
- **Loading UX**: Semi-transparent overlay over chart area when filter changes

### Loading UX
- **Dashboard**: instant paint from the localStorage snapshot (SWR) when one exists; otherwise full-page spinner until the two parallel requests resolve. Per-card overlays only appear on the legacy per-card fallback path.
- **Detail Page**: Full-page spinner on initial load, chart overlay on filter changes
- **Visibility API**: Auto-refreshes on app resume — dashboard: one silent batch request, gated on (a) the dashboard route being active (the reuse strategy keeps the detached dashboard's listener alive on the detail page) and (b) the last snapshot being >60s old; detail page: reloads its current filter (2s debounce)
- **Timeouts**: every HTTP call has a 15s rxjs `timeout` — without it, the SW freshness strategy waits on the network forever when its cache is empty (eternal spinner)

### Navigation
- **Dashboard Cards**: Icon button (chevron right) in top-right corner navigates to detail page
- **Detail Page**: Back button in header returns to dashboard
- **No Nested Routes**: Fixed double-back issue by removing nested routerLinks

### PWA (Progressive Web App)
- **Service Worker**: Angular SW (`@angular/service-worker`, `ngsw-config.json`);
  only active in production builds and on secure origins (HTTPS or localhost)
- **HTTPS origin**: `https://s03.ruffe-vega.ts.net:8443` via `tailscale serve` on s03
  (TLS termination with the tailnet's Let's Encrypt cert, tailnet-only). Plain
  `http://s03:8081` keeps working, just without SW/installability.
- **App shell**: prefetched (hashed JS/CSS, index.html, manifest, icons)
- **API caching**: `dataGroups` with `freshness` strategy (network-first with
  timeout, cache fallback). **Order matters**: ngsw compiles the URL globs into
  UNANCHORED regexes and the first matching group wins — the specific
  `api-measurements` group (5s/64 entries, covers `/api/stations/*/measurements`
  and the batch `/api/stations/measurements`) must stay declared BEFORE
  `api-meta` (3s/8), otherwise the meta pattern `/api/stations` substring-matches
  every measurement URL and traps everything in the 8-entry LRU (that bug caused
  the remote eternal-spinner). Offline shows the last-known data; the dashboard
  additionally keeps its own localStorage snapshot (`DashboardCacheService`) for
  instant SWR paints; `LastUpdatedPipe` makes staleness visible on the detail page (kept ticking via `ClockService`); deliberately NO extra indicators on the dashboard cards (visual changes there were explicitly not wanted).
  WebSocket traffic is not cached.
- **Updates**: `SwUpdateService` (core/services) prompts to reload on
  `VERSION_READY` and calls `checkForUpdate()` on `visibilitychange`. nginx serves
  `index.html`/`ngsw.json`/`ngsw-worker.js` with `no-cache`, hashed assets as
  `immutable`.
- **Manifest/icons**: `public/manifest.webmanifest`; PNGs + favicon are derived
  from `public/icons/icon.svg` (header-logo cloud on the brand gradient, maskable)

## Known Issues & Notes

- **Typo**: Dashboard component class is named `Dashbaord` (missing 'a') - used consistently throughout routing and module
- **WebSocket Reconnect**: Configured with 1-second reconnect delay and 10-second heartbeats
- **Build Budgets**: Initial bundle limited to 1MB (error), component styles limited to 8kB (error)
- **Container Mode**: `startContainer` script uses `--host 0.0.0.0 --poll 2000` for Docker/container environments
- **Measurement Frequency**: Sensors POST every **15 seconds** (since the 2026-06-08 SHT3x changeover; was 30s before). The API (`AirQualityApi`) mitigates DB growth with scheduled **thinning** (>10 min → 30s, >1 h → 60s, >1 day → 300s; tiers run 5-min/hourly/daily since 0.7.0), so longer windows return progressively coarser data; on top of that, `maxPoints` sampling caps what actually gets transferred.
- **Unit tests**: the generated component specs (4 of 5) have been failing since long before the 2026-09 performance work (no providers/mocks were ever set up); `ng build` is the working verification. Fixing the specs is open.
