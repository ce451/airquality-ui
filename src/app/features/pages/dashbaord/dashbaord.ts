import {Component, OnDestroy, OnInit} from '@angular/core';
import {StationService} from 'src/app/core/services/station.service';
import {Station} from 'src/app/core/models/station.model';
import {StationGroup} from 'src/app/core/models/station-group.model';
import {StationGroupService} from 'src/app/core/services/station-group.service';
import {forkJoin} from 'rxjs';

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
  private visibilityChangeHandler: () => void;

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
    if (!document.hidden) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.isLoading = true;

    const observables = forkJoin({
      stationGroups: this.stationGroupService.getAllStationGroups(),
      stations: this.stationService.getAllStationsWithLatestMeasurement()
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
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }
}
