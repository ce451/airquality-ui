import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Measurement} from 'src/app/core/models/measurement.model';
import {BaseChartDirective} from 'ng2-charts';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {WebSocketService} from 'src/app/core/services/web-socket.service';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-station-card',
  standalone: false,
  templateUrl: './station-card.html',
  styleUrl: './station-card.scss'
})
export class StationCard implements OnInit, OnChanges, OnDestroy {
  @Input() station!: Station;
  @Input() showStats: boolean = true;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  protected measurements: Measurement[] = [];
  protected isLoadingMeasurements: boolean = false;
  protected hasNoData: boolean = false;
  protected loadError: boolean = false;

  private subs = new Subscription();
  private wsSub?: Subscription;
  private fetchSub?: Subscription;
  private subscribedStationId?: number;

  private tempColor = this.getCssVar('--color-temperature');
  private humColor = this.getCssVar('--color-humidity');
  private absHumColor = this.getCssVar('--color-absolute-humidity');

  private minTemp = 0;
  private maxTemp = 50;
  private minHum = 0;
  private maxHum = 100;
  private minAbsHum = 0;
  private maxAbsHum = 30;

  private temperatureData: number[] = [];
  private humidityData: number[] = [];
  private absoluteHumidityData: number[] = [];

  protected chartData!: ChartConfiguration['data'];
  protected chartOptions!: ChartConfiguration['options'];
  protected chartType: ChartType = 'line';

  protected currentScreenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xs';

  private displayNameMap = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
    // Tailwind’s 2xl = min-width 1536px (not in CDK by default, so add manually)
    ['(min-width: 1536px)', '2xl']
  ]);

  constructor(private stationService: StationService,
              private breakpointObserver: BreakpointObserver,
              private webSocketService: WebSocketService,
              private router: Router) {
  }

  ngOnInit() {
    // if (!this.station) {
    //   throw new Error('Station input is required');
    // }

    this.subs.add(this.breakpointObserver
      .observe([...this.displayNameMap.keys()])
      .subscribe(result => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.currentScreenSize = (this.displayNameMap.get(query) as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') ?? 'xs';
          }
        }
      }));

    // this.stationService
    //   .getStationByIdWithMeasurements(this.station.id)
    //   .subscribe(data => {
    //     console.log('measurements for station:', data);
    //     if (data.measurements) {
    //       this.parseMeasurements(data.measurements);
    //       this.setupChartOptions();
    //       this.chart?.update();
    //     }
    //   });
    //
    // this.webSocketService.streamForStation(this.station.id).subscribe(data => {
    //   if (data) {
    //     // Append new data point
    //     this.measurements = this.measurements || [];
    //
    //     console.log('station: ', this.station.name, this.station);
    //     console.log('existing measurements for station: ', this.measurements);
    //     console.log('new measurement for station: ', data);
    //     // append new item to the front of the array
    //     this.measurements.unshift(data);
    //     this.measurements.pop();
    //     console.log('new measurements: ', this.measurements);
    //
    //     this.parseMeasurements(this.measurements);
    //     this.setupChartOptions();
    //     this.chart?.update();
    //   }
    // });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.wsSub?.unsubscribe();
    this.fetchSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.station && this.station.id) {
      this.measurements = [...(this.station.measurements || [])];
      // Only the dashboard card (showStats=true) follows the live stream. The
      // detail card pre-samples its window (week/month), so a 15s live point
      // unshift/pop would corrupt the sampled series — it refreshes via the
      // filter/visibility reload instead.
      if (this.showStats) {
        this.ensureWsSubscription();
      }
      this.initStationData();
    }
  }

  private initStationData() {
    // Only fetch from API if we have less than 2 measurements
    // (Dashboard now passes stations without measurements)
    // Detail page passes pre-filtered measurements, don't re-fetch those
    const shouldFetch = !this.station.measurements || this.station.measurements.length <= 1;

    if (shouldFetch) {
      this.fetchMeasurements(true);
    } else {
      // Use measurements passed from parent
      this.parseMeasurements(this.measurements);
      this.setupChartOptions();
      this.chart?.update();
    }
  }

  // Subscribe to the live measurement stream exactly once per station id.
  // Re-running ngOnChanges (e.g. a switch-back refresh) must not stack subscriptions.
  private ensureWsSubscription(): void {
    if (this.subscribedStationId === this.station.id && this.wsSub) {
      return;
    }
    this.wsSub?.unsubscribe();
    this.subscribedStationId = this.station.id;
    this.wsSub = this.webSocketService.streamForStation(this.station.id).subscribe(data => {
      if (data) {
        this.measurements = this.measurements || [];
        this.measurements.unshift(data);
        this.measurements.pop();

        this.parseMeasurements(this.measurements);
        this.setupChartOptions();
        this.chart?.update();
      }
    });
  }

  // Fetch the last hour of measurements. showOverlay=true blanks the card with the
  // spinner (first load); false refreshes silently in the background (switch-back).
  private fetchMeasurements(showOverlay: boolean): void {
    // Don't let a silent refresh interrupt an in-flight overlay (first) load —
    // cancelling it would strand the spinner. Concurrent silent refreshes are
    // serialized by fetchSub.unsubscribe() below (latest wins).
    if (this.isLoadingMeasurements) {
      return;
    }
    if (showOverlay) {
      this.isLoadingMeasurements = true;
    }
    this.loadError = false;
    this.fetchSub?.unsubscribe();
    this.fetchSub = this.stationService
      .getStationByIdWithMeasurements(this.station.id, 60) // Last 1 hour for dashboard
      .subscribe({
        next: data => {
          if (data.measurements) {
            this.measurements = data.measurements;
            this.parseMeasurements(data.measurements);
            this.setupChartOptions();
            this.chart?.update();
          }
          this.isLoadingMeasurements = false;
        },
        error: err => {
          console.error(err);
          this.loadError = true;
          this.isLoadingMeasurements = false;
        }
      });
  }

  // Silent background refresh triggered by the dashboard when the app returns to
  // the foreground. No-op for the detail-page card (it owns its measurements).
  public refresh(): void {
    if (!this.showStats || !this.station || !this.station.id) {
      return;
    }
    this.fetchMeasurements(false);
  }

  retryLoad(): void {
    this.fetchMeasurements(true);
  }

  parseMeasurements(measurements: Measurement[]): void {
    if (!measurements || measurements.length === 0) {
      // No data: avoid Math.min(...[]) yielding ±Infinity axis bounds. Reset the
      // axis fields to their defaults (setupChartOptions reads these same fields)
      // and clear the chart so the empty-state overlay shows instead.
      this.hasNoData = true;
      this.minTemp = 0;
      this.maxTemp = 50;
      this.minHum = 0;
      this.maxHum = 100;
      this.minAbsHum = 0;
      this.maxAbsHum = 30;
      this.temperatureData = [];
      this.humidityData = [];
      this.absoluteHumidityData = [];
      this.chartData = {labels: [], datasets: []};
      return;
    }
    this.hasNoData = false;

    const labels = measurements.map(m => new Date(m.timestamp).toLocaleTimeString());
    this.temperatureData = measurements.map(m => m.temperature);
    this.humidityData = measurements.map(m => m.humidity);
    this.absoluteHumidityData = measurements.map(m => m.absoluteHumidity);

    this.minTemp = Math.floor(Math.min(...this.temperatureData)) - 2;
    this.maxTemp = Math.ceil(Math.max(...this.temperatureData)) + 2;
    this.minHum = Math.floor(Math.min(...this.humidityData) / 10) * 10 - 10;
    this.maxHum = Math.ceil(Math.max(...this.humidityData)) + 2;
    this.minAbsHum = Math.floor(Math.min(...this.absoluteHumidityData)) - 1;
    this.maxAbsHum = Math.ceil(Math.max(...this.absoluteHumidityData)) + 5;

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: this.temperatureData,
          borderColor: this.tempColor,
          backgroundColor: this.tempColor + '33',
          fill: true,
          order: 1,
          yAxisID: 'y',
          tension: 0.5,
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Humidity (%)',
          data: this.humidityData,
          borderColor: this.humColor,
          backgroundColor: this.humColor + '33',
          fill: true,
          order: 2,
          yAxisID: 'y1',
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Absolute Humidity (g/m³)',
          data: this.absoluteHumidityData,
          borderColor: this.absHumColor,
          backgroundColor: this.absHumColor + '33',
          fill: true,
          order: 3,
          yAxisID: 'y2',
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
        }
      ]
    };
  }

  setupChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 0,
          right: 5,
          top: 5,
          bottom: 5
        }
      },
      scales: {
        x: {
          display: false,
          reverse: true
        },
        y: {
          beginAtZero: false,
          ticks: {
            color: this.tempColor,
            padding: 0
          },
          grid: {
            drawOnChartArea: false,
          },
          min: this.minTemp,
          max: this.maxTemp,
        },
        y1: {
          beginAtZero: false,
          ticks: {
            color: this.humColor,
            padding: 0
          },
          grid: {
            drawOnChartArea: false,
          },
          min: this.minHum,
          max: this.maxHum,
        },
        y2: {
          beginAtZero: false,
          ticks: {
            color: this.absHumColor,
            padding: 0
          },
          min: this.minAbsHum,
          max: this.maxAbsHum,
        }
      },
      elements: {
        point: {
          pointStyle: false
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
      animation: false
    };
  }

  getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  navigateToDetail(): void {
    this.router.navigate(['/station', this.station.id]);
  }

}
