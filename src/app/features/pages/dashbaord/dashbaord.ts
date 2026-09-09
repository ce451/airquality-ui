import {Component, OnDestroy, OnInit} from '@angular/core';
import {StationService} from 'src/app/core/services/station.service';
import {Station} from 'src/app/core/models/station.model';
import {StationGroup} from 'src/app/core/models/station-group.model';
import {StationGroupService} from 'src/app/core/services/station-group.service';
import {catchError, forkJoin, throwError} from 'rxjs';

// Dashboard cards render a 1-hour sparkline a few hundred px wide; ~150 points
// is already denser than the drawing, anything more is wasted transfer.
const CARD_WINDOW_MINUTES = 60;
const CARD_MAX_POINTS = 150;

@Component({
  selector: 'app-dashbaord',
  standalone: false,
  templateUrl: './dashbaord.html',
  styleUrl: './dashbaord.scss'
})
export class Dashbaord implements OnInit, OnDestroy {
  stations: Station[] = [];
  stationGroups: StationGroup[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  private visibilityChangeHandler: () => void;
  private loadInFlight = false;
  private lastVisibilityRefresh = 0;

  constructor(private stationService: StationService,
              private stationGroupService: StationGroupService,) {
    this.visibilityChangeHandler = () => this.handleVisibilityChange();
  }

  ngOnInit(): void {
    this.loadData();
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      return;
    }
    const now = Date.now();
    if (now - this.lastVisibilityRefresh < 2000) {
      return;
    }
    this.lastVisibilityRefresh = now;
    // If the initial load never produced any cards (e.g. offline cold start or
    // a failed/interrupted first load), retry with the full spinner. Otherwise
    // refresh silently: one batch request re-fills every card in place.
    if (!this.stations.length) {
      this.loadData();
      return;
    }
    this.loadData({silent: true});
  }

  retry(): void {
    this.loadData();
  }

  private loadData(options: { silent: boolean } = {silent: false}): void {
    if (this.loadInFlight) {
      return;
    }
    this.loadInFlight = true;
    if (!options.silent) {
      this.isLoading = true;
    }
    this.hasError = false;

    // Groups and the batch series load in parallel: 2 requests total instead
    // of 2 + one measurements request per card.
    const observables = forkJoin({
      stationGroups: this.stationGroupService.getAllStationGroups(),
      stations: this.stationService
        .getAllStationsWithMeasurements(CARD_WINDOW_MINUTES, CARD_MAX_POINTS)
        .pipe(
          // Rollout fallback: an API without the batch endpoint answers 404.
          // Degrade to the plain station list - each card then fetches its own
          // series exactly as before.
          catchError(err => err?.status === 404
            ? this.stationService.getAllStations()
            : throwError(() => err))
        )
    });

    observables.subscribe({
      next: ({stationGroups, stations}) => {
        this.stationGroups = stationGroups;
        this.stations = stations;

        this.stationGroups.sort((a, b) => a.displayOrder - b.displayOrder);

        this.stationGroups.forEach(group => {
          group.stations = this.stations.filter(station => station.stationGroupId === group.id);
          group.stations.sort((a, b) => a.displayOrder - b.displayOrder);
        });

        this.isLoading = false;
        this.loadInFlight = false;
      },
      error: err => {
        console.error(err);
        // A failed silent refresh keeps showing the data that is already on
        // screen; the full-page error state is only for an empty dashboard.
        this.hasError = !this.stations.length;
        this.isLoading = false;
        this.loadInFlight = false;
      },
    });
  }
}
