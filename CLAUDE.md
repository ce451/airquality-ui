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

**Data Flow**:
1. **Initial Load**: `Dashboard` component uses `forkJoin` to fetch station groups and stations with latest measurements from REST API
2. **Grouping Logic**: Stations are grouped by `stationGroupId` and sorted by `displayOrder` within each group
3. **Real-time Updates**: `WebSocketService` connects to `/ws` endpoint via SockJS/STOMP and subscribes to `/topic/measurements`
4. **Component Updates**: `StationCard` subscribes to filtered WebSocket stream for its specific station and updates chart data

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
- `GET /stations` - All stations
- `GET /stations/latestMeasurement` - Stations with latest measurement
- `GET /stations/:id` - Single station
- `GET /stations/:id/measurements` - Station with measurement history

**WebSocket**:
- Endpoint: `/ws`
- Topic: `/topic/measurements`
- Message format: JSON matching `Measurement` model

### Data Models

**Station**: Contains `id`, `name`, `ipAddress`, `status`, `stationGroupId`, `displayOrder`, and `measurements[]`

**Measurement**: Contains `id`, `stationId`, `temperature`, `humidity`, `absoluteHumidity`, `timestamp`

**StationGroup**: Groups for organizing stations with display ordering

## Known Issues & Notes

- **Typo**: Dashboard component class is named `Dashbaord` (missing 'a') - used consistently throughout routing and module
- **WebSocket Reconnect**: Configured with 1-second reconnect delay and 10-second heartbeats
- **Build Budgets**: Initial bundle limited to 1MB (error), component styles limited to 8kB (error)
- **Container Mode**: `startContainer` script uses `--host 0.0.0.0 --poll 2000` for Docker/container environments
