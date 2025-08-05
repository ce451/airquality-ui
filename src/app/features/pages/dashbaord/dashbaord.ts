import {Component} from '@angular/core';
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
export class Dashbaord {
  stations: Station[] = [];
  stationGroups: StationGroup[] = [];

  constructor(private stationService: StationService,
              private stationGroupService: StationGroupService,) {
  }

  ngOnInit(): void {

    var observables = forkJoin({
      stationGroups: this.stationGroupService.getAllStationGroups(),
      stations: this.stationService.getAllStationsWithLatestMeasurement()
    });

    observables.subscribe({
      next: ({stationGroups, stations}) => {
        this.stationGroups = stationGroups;
        this.stations = stations;

        this.stationGroups.sort((a, b) => a.displayOrder - b.displayOrder);

        console.log('raw stationsGroups: ', this.stationGroups);
        console.log('raw stations: ', this.stations);

        this.stationGroups.forEach(group => {
          group.stations = this.stations.filter(station => station.stationGroupId === group.id);
          group.stations.sort((a, b) => a.displayOrder - b.displayOrder);
        });

        console.log('stations grouped and sorted: ', this.stationGroups);
      },
      error: err => console.error(err),
    });
  }
}
