import {Component, OnDestroy, OnInit} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {ActivatedRoute} from '@angular/router';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';

@Component({
  selector: 'app-station-detail',
  standalone: false,
  templateUrl: './station-detail.html',
  styleUrl: './station-detail.scss'
})
export class StationDetail implements OnInit, OnDestroy {
  station!: Station;
  chartData!: ChartConfiguration['data'];
  chartOptions!: ChartConfiguration['options'];
  chartType: ChartType = 'line';
  isLoading: boolean = true;
  private currentStationId?: number;
  private visibilityChangeHandler: () => void;

  constructor(private route: ActivatedRoute,
              private stationService: StationService) {
    this.visibilityChangeHandler = () => this.handleVisibilityChange();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const stationId = +params['id'];
      if (isNaN(stationId)) {
        throw new Error('Invalid station ID');
      }
      this.currentStationId = stationId;
      this.loadData();
    });

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private handleVisibilityChange(): void {
    if (!document.hidden && this.currentStationId) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (!this.currentStationId) return;

    this.isLoading = true;

    this.stationService.getStationByIdWithMeasurements(this.currentStationId).subscribe({
      next: station => {
        this.station = station;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
