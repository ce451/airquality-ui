import {Component, Input} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {ActivatedRoute} from '@angular/router';
import {StationService} from 'src/app/core/services/station.service';

@Component({
  selector: 'app-station-detail',
  standalone: false,
  templateUrl: './station-detail.html',
  styleUrl: './station-detail.scss'
})
export class StationDetail {

  station!: Station;

  constructor(private route: ActivatedRoute,
              private stationService: StationService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const stationId = +params['id'];
      if (isNaN(stationId)) {
        throw new Error('Invalid station ID');
      }
      console.log('Station ID:', stationId);


      this.stationService.getStationByIdWithMeasurements(stationId).subscribe(station => {
        this.station = station;
      });

    })
  }
}
