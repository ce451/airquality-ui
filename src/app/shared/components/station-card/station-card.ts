import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Measurement} from 'src/app/core/models/measurement.model';
import {BaseChartDirective} from 'ng2-charts';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {WebSocketService} from 'src/app/core/services/web-socket.service';

@Component({
  selector: 'app-station-card',
  standalone: false,
  templateUrl: './station-card.html',
  styleUrl: './station-card.scss'
})
export class StationCard implements OnInit, OnChanges {
  @Input() station!: Station;
  @Input() showStats: boolean = true;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  protected measurements: Measurement[] = [];

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
              private webSocketService: WebSocketService) {
  }

  ngOnInit() {
    // if (!this.station) {
    //   throw new Error('Station input is required');
    // }

    this.breakpointObserver
      .observe([...this.displayNameMap.keys()])
      .subscribe(result => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.currentScreenSize = (this.displayNameMap.get(query) as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') ?? 'xs';
          }
        }
      });

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

  ngOnChanges(changes: SimpleChanges) {
    // if (changes['station']?.currentValue) {
    console.log('ngOnChanges station:', this.station);
    if (this.station && this.station.id) {
      this.measurements = [...(this.station.measurements || [])];
      console.log('ngOnChanges measurements:', this.station.name, this.measurements);
      this.initStationData();
    }
  }

  private initStationData() {
    this.stationService
      .getStationByIdWithMeasurements(this.station.id)
      .subscribe(data => {
        if (data.measurements) {
          this.measurements = data.measurements;
          this.parseMeasurements(data.measurements);
          this.setupChartOptions();
          this.chart?.update();
        }
      });

    this.webSocketService.streamForStation(this.station.id).subscribe(data => {
      if (data) {
        console.log('New measurement for station ', this.station.name, data);
        console.log('Existing measurements for station ', this.station.name, this.measurements);

        this.measurements = this.measurements || [];
        this.measurements.unshift(data);
        this.measurements.pop();

        this.parseMeasurements(this.measurements);
        this.setupChartOptions();
        this.chart?.update();
      }
    });
  }

  parseMeasurements(measurements: Measurement[]): void {
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

    // log all the min and max values
    console.log('Min/Max Values:', {
      minTemp: this.minTemp,
      maxTemp: this.maxTemp,
      minHum: this.minHum,
      maxHum: this.maxHum,
      minAbsHum: this.minAbsHum,
      maxAbsHum: this.maxAbsHum
    });

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
      scales: {
        x: {
          display: false,
          reverse: true
        },
        y: {
          beginAtZero: false,
          ticks: {
            color: this.tempColor,
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

}
