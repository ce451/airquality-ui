import {Component} from '@angular/core';
import {StationService} from 'src/app/core/services/station.service';
import {Station} from 'src/app/core/models/station.model';

@Component({
  selector: 'app-dashbaord',
  standalone: false,
  templateUrl: './dashbaord.html',
  styleUrl: './dashbaord.scss'
})
export class Dashbaord {
  stations: Station[] = [];

  constructor(private stationService: StationService) {
  }

  ngOnInit(): void {
    this.stationService.getAllStationsWithLatestMeasurement().subscribe({
      next: (data) => {
        this.stations = data;
        console.log('Stations loaded:', this.stations);
      },
      error: error => console.error(error)
    });
  }
}
