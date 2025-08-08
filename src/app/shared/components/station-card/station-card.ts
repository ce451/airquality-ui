import {Component, Input, ViewChild} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Measurement} from 'src/app/core/models/measurement.model';
import {BaseChartDirective} from 'ng2-charts';

@Component({
  selector: 'app-station-card',
  standalone: false,
  templateUrl: './station-card.html',
  styleUrl: './station-card.scss'
})
export class StationCard {
  @Input() station!: Station;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  tempColor = this.getCssVar('--color-temperature');
  humColor = this.getCssVar('--color-humidity');
  absHumColor = this.getCssVar('--color-absolute-humidity');

  minTemp = 0;
  maxTemp = 50;
  minHum = 0;
  maxHum = 100;
  minAbsHum = 0;
  maxAbsHum = 30;

  chartData!: ChartConfiguration['data'];
  chartOptions!: ChartConfiguration['options'];
  chartType: ChartType = 'line';

  constructor(private stationService: StationService) {
  }

  ngOnInit() {
    if (!this.station) {
      throw new Error('Station input is required');
    }

    this.stationService
      .getStationByIdWithMeasurements(this.station.id)
      .subscribe(data => {
        console.log('measurements for station:', data);
        if(data.measurements) {
          this.parseMeasurements(data.measurements);
          this.setupChartOptions();
          this.chart?.update();
        }
      });
  }

  parseMeasurements(measurements: Measurement[]): void {
    const labels = measurements.map(m => new Date(m.timestamp).toLocaleTimeString());
    const temperatureData = measurements.map(m => m.temperature);
    const humidityData = measurements.map(m => m.humidity);
    const absoluteHumidityData = measurements.map(m => m.absoluteHumidity);

    this.minTemp = Math.floor(Math.min(...temperatureData)) - 2;
    this.maxTemp = Math.ceil(Math.max(...temperatureData)) + 2;
    this.minHum = Math.floor(Math.min(...humidityData) / 10) * 10 - 10;
    this.maxHum = Math.ceil(Math.max(...humidityData)) + 2;
    this.minAbsHum = Math.floor(Math.min(...absoluteHumidityData)) - 1;
    this.maxAbsHum = Math.ceil(Math.max(...absoluteHumidityData)) + 5;

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
          data: temperatureData,
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
          data: humidityData,
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
          data: absoluteHumidityData,
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
      // maintainAspectRatio: false,
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
      }
    };
  }

  getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

}
