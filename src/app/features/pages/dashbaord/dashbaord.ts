import {Component, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {StationService} from 'src/app/core/services/station.service';
import {Station} from 'src/app/core/models/station.model';
import {StationGroup} from 'src/app/core/models/station-group.model';
import {StationGroupService} from 'src/app/core/services/station-group.service';
import {StationCard} from 'src/app/shared/components/station-card/station-card';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-dashbaord',
  standalone: false,
  templateUrl: './dashbaord.html',
  styleUrl: './dashbaord.scss'
})
export class Dashbaord implements OnInit, OnDestroy {
  @ViewChildren(StationCard) cards?: QueryList<StationCard>;
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
    // If the initial load never produced any cards (e.g. offline cold start or a
    // failed/interrupted first load), retry it. Otherwise refresh each card's
    // measurements silently — no list refetch, no grid blank. The station list
    // itself is intentionally fetched only once (sensors rarely change, and the
    // card shows no status field); a full reload picks up added/removed/renamed
    // stations.
    if (!this.stations.length) {
      this.loadData();
      return;
    }
    this.cards?.forEach(card => card.refresh());
  }

  retry(): void {
    this.loadData();
  }

  private loadData(): void {
    if (this.loadInFlight) {
      return;
    }
    this.loadInFlight = true;
    this.isLoading = true;
    this.hasError = false;

    // First, fetch station groups and stations (without measurements)
    const observables = forkJoin({
      stationGroups: this.stationGroupService.getAllStationGroups(),
      stations: this.stationService.getAllStations()
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

        // Show cards immediately (measurements will load progressively in station-card component)
        this.isLoading = false;
        this.loadInFlight = false;
      },
      error: err => {
        console.error(err);
        this.hasError = true;
        this.isLoading = false;
        this.loadInFlight = false;
      },
    });
  }
}
