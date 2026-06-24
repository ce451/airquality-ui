import {Component, OnDestroy, OnInit} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {ActivatedRoute} from '@angular/router';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Subscription} from 'rxjs';

type TimeFilter = '1h' | '3h' | '24h' | 'week' | 'month';

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
  isLoadingChart: boolean = false;
  selectedFilter: TimeFilter = '24h';
  private currentStationId?: number;
  private visibilityChangeHandler: () => void;
  private hasLoadedOnce = false;
  private lastVisibilityRefresh = 0;
  private routeSub?: Subscription;
  private loadSub?: Subscription;

  constructor(private route: ActivatedRoute,
              private stationService: StationService) {
    this.visibilityChangeHandler = () => this.handleVisibilityChange();
  }

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
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
    this.routeSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  private handleVisibilityChange(): void {
    if (document.hidden || !this.currentStationId || !this.hasLoadedOnce) {
      return;
    }
    const now = Date.now();
    if (now - this.lastVisibilityRefresh < 2000) {
      return;
    }
    this.lastVisibilityRefresh = now;
    this.loadData();
  }

  private loadData(): void {
    if (!this.currentStationId) return;

    // Full-page spinner only on the genuine first load; later loads (filter
    // change, switch-back refresh) use the lighter chart overlay.
    if (!this.hasLoadedOnce) {
      this.isLoading = true;
    } else {
      this.isLoadingChart = true;
    }

    const minutes = this.getMinutesForFilter(this.selectedFilter);

    // Cancel any in-flight request so the latest filter/refresh always wins — a
    // rapid filter tap must not be dropped (which would strand the chart on the
    // previous filter's data under a mislabeled, highlighted button).
    this.loadSub?.unsubscribe();
    this.loadSub = this.stationService.getStationByIdWithMeasurements(this.currentStationId, minutes).subscribe({
      next: station => {
        // Sample measurements for week and month to reduce data points
        if (station.measurements && station.measurements.length > 0) {
          const samplingRate = this.getSamplingRate(this.selectedFilter);
          if (samplingRate > 1) {
            station.measurements = station.measurements.filter((_, index) => index % samplingRate === 0);
          }
        }
        this.station = station;
        this.hasLoadedOnce = true;
        this.isLoading = false;
        this.isLoadingChart = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
        this.isLoadingChart = false;
      }
    });
  }

  setTimeFilter(filter: TimeFilter): void {
    this.selectedFilter = filter;
    this.loadData();
  }

  private getMinutesForFilter(filter: TimeFilter): number {
    switch (filter) {
      case '1h':
        return 60;
      case '3h':
        return 180;
      case '24h':
        return 1440;
      case 'week':
        return 10080; // 7 days
      case 'month':
        return 43200; // 30 days
      default:
        return 1440;
    }
  }

  private getSamplingRate(filter: TimeFilter): number {
    // Measurements are stored every 30 seconds
    // Sample to reduce chart data points for better performance
    switch (filter) {
      case '1h':
        return 1; // Keep all (120 points)
      case '3h':
        return 1; // Keep all (360 points)
      case '24h':
        return 3; // Every 1.5 min (~960 points)
      case 'week':
        return 10; // Every 5 min (~2,016 points)
      case 'month':
        return 20; // Every 10 min (~4,320 points)
      default:
        return 1;
    }
  }
}
