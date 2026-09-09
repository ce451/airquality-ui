import {Component, OnDestroy, OnInit} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {ActivatedRoute} from '@angular/router';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Subscription} from 'rxjs';

type TimeFilter = '1h' | '3h' | '24h' | 'week' | 'month';

// A detail chart is at most ~1200px wide - the server samples the series down
// to this size (evenly strided, newest+oldest kept). Before, the full series
// was transferred and mostly discarded client-side: the month filter downloaded
// ~9900 points (1.7 MB uncompressed) to render ~500.
const DETAIL_MAX_POINTS = 500;

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

  retry(): void {
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
    this.loadSub = this.stationService.getStationByIdWithMeasurements(this.currentStationId, minutes, DETAIL_MAX_POINTS).subscribe({
      next: station => {
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
}
