import {Injectable} from '@angular/core';
import {Station} from '../models/station.model';
import {StationGroup} from '../models/station-group.model';

export interface DashboardSnapshot {
  savedAt: number;
  stationGroups: StationGroup[];
  stations: Station[];
}

const STORAGE_KEY = 'aq.dashboard.v1';
// Snapshots older than this are discarded on load (matches the SW dataGroup
// maxAge). The age stamp makes moderate staleness visible; week-old data is
// just noise.
const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Last-known dashboard data (stale-while-revalidate). On a slow remote link
 * the grid renders instantly from this snapshot while the network request runs
 * in the background; the per-card "x min ago" stamp makes staleness visible.
 * Purely best-effort: localStorage can be unavailable (private mode, quota) -
 * every access is guarded and a miss just means the usual spinner.
 */
@Injectable({providedIn: 'root'})
export class DashboardCacheService {

  load(): DashboardSnapshot | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const snapshot = JSON.parse(raw) as DashboardSnapshot;
      if (!snapshot || !Array.isArray(snapshot.stationGroups) || !Array.isArray(snapshot.stations)) {
        return null;
      }
      if (!snapshot.savedAt || Date.now() - snapshot.savedAt > SNAPSHOT_TTL_MS) {
        return null;
      }
      return snapshot;
    } catch {
      return null;
    }
  }

  // Call with the raw API responses, before the dashboard attaches the station
  // arrays onto the groups - otherwise every station would be serialized twice.
  save(stationGroups: StationGroup[], stations: Station[]): void {
    try {
      const snapshot: DashboardSnapshot = {savedAt: Date.now(), stationGroups, stations};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // quota exceeded / storage disabled: skip silently
    }
  }
}
