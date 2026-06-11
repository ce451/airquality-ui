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

**Data Flow & Progressive Loading**:
1. **Initial Load (Progressive)**: `Dashboard` component uses `forkJoin` to fetch station groups and stations WITHOUT measurements first
   - Cards appear immediately with station metadata
   - Each `StationCard` independently fetches its measurements (last 1 hour) in the background
   - Semi-transparent loading overlay (70% opacity) appears over each card while measurements load
2. **Grouping Logic**: Stations are grouped by `stationGroupId` and sorted by `displayOrder` within each group
3. **Real-time Updates**: `WebSocketService` connects to `/ws` endpoint via SockJS/STOMP and subscribes to `/topic/measurements`
4. **Component Updates**: `StationCard` subscribes to filtered WebSocket stream for its specific station and updates chart data
5. **Navigation**: Dashboard cards use icon button in top-right corner for navigation (not whole-card clickable)

**WebSocket Architecture**:
- Service: `WebSocketService` (singleton, initialized on construction)
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
and removes the CORS dependency. Development (`environment.development.ts`) still
talks directly to `http://localhost:8080`.

The endpoint paths below are backend paths (prefixed with `/api` in production):

**REST Endpoints**:
- `GET /stations` - All stations (used for progressive loading)
- `GET /stations/latestMeasurement` - Stations with latest measurement (not currently used)
- `GET /stations/:id` - Single station
- `GET /stations/:id/measurements?minutes=X` - Station with measurement history filtered by time
  - Supports query parameter `minutes` (default: 60)
  - Used with HttpParams for proper parameter encoding
  - Dashboard cards: `minutes=60` (1 hour)
  - Detail page filters: `60`, `1440`, `10080`, `43200` (1h, 24h, week, month)

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
- **Filter Options**: 1 Hour, 24 Hours, Week (7 days), Month (30 days)
- **Default**: 24 Hours
- **Server-Side Filtering**: Queries backend with `minutes` parameter to reduce data transfer
- **Data Sampling**: Client-side sampling reduces chart data points for performance
  (every Nth measurement: 1h all, 24h 3rd, week 10th, month 20th). Point counts scale
  with the raw sample rate — at the current **15s** rate roughly double the older
  30s-era figures (e.g. 1h ≈ 240 points, not ~120). Note: the API now **thins older
  data server-side** (see "Measurement Frequency" below), so longer windows return
  progressively coarser data regardless of client sampling.
- **Loading UX**: Semi-transparent overlay over chart area when filter changes

### Progressive Loading
- **Dashboard**: Cards appear immediately, measurements load in background per card
- **Loading Overlays**: 70% opacity white/gray overlay with backdrop blur and spinner
- **Detail Page**: Full-page spinner on initial load, chart overlay on filter changes
- **Visibility API**: Auto-refreshes data when switching back to app (Android use case)

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
  timeout, cache fallback): `/api/stations*`, `/api/stationgroups`. Offline shows
  the last-known data; `LastUpdatedPipe` makes staleness visible. WebSocket traffic
  is not cached.
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
- **Measurement Frequency**: Sensors POST every **15 seconds** (since the 2026-06-08 SHT3x changeover; was 30s before). This doubled the per-card payload (~239 points/hour) and was the cause of slower dashboard loading. The API (`AirQualityApi`) mitigates DB growth with a scheduled **thinning** task that downsamples older data (>10 min → 30s, >1 h → 60s, >1 day → 300s); once deployed, longer detail-page windows return progressively coarser data.
