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

API Base URL configured in environment files (currently points to `http://s03:8080`):

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
- Endpoint: `/ws`
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
  - 1h: Keep all (~120 points)
  - 24h: Every 3rd measurement (~960 points)
  - Week: Every 10th measurement (~2,016 points)
  - Month: Every 20th measurement (~4,320 points)
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

## Known Issues & Notes

- **Typo**: Dashboard component class is named `Dashbaord` (missing 'a') - used consistently throughout routing and module
- **WebSocket Reconnect**: Configured with 1-second reconnect delay and 10-second heartbeats
- **Build Budgets**: Initial bundle limited to 1MB (error), component styles limited to 8kB (error)
- **Container Mode**: `startContainer` script uses `--host 0.0.0.0 --poll 2000` for Docker/container environments
- **Measurement Frequency**: Backend stores measurements every 30 seconds
