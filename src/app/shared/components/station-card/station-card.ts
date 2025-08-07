import {Component, Input} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';
import {StationService} from 'src/app/core/services/station.service';
import {ChartConfiguration, ChartType} from 'chart.js';
import {Measurement} from 'src/app/core/models/measurement.model';

@Component({
  selector: 'app-station-card',
  standalone: false,
  templateUrl: './station-card.html',
  styleUrl: './station-card.scss'
})
export class StationCard {
  @Input() station!: Station;

  tempColor = this.getCssVar('--color-temperature');
  humColor = this.getCssVar('--color-humidity');
  absHumColor = this.getCssVar('--color-absolute-humidity');


  chartData!: ChartConfiguration['data'];
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    // maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
        reverse: true
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: this.tempColor,
        }
      },
      y1: {
        beginAtZero: true,
        ticks: {
          color: this.humColor,
        }
      },
      y2: {
        beginAtZero: true,
        ticks: {
          color: this.absHumColor,
        }
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
  chartType: ChartType = 'line';

  constructor(private stationService: StationService) {
  }

  // onInit
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
        }
      });
  }

  parseMeasurements(measurements: Measurement[]): void {
    const labels = measurements.map(m => new Date(m.timestamp).toLocaleTimeString());
    const temperatureData = measurements.map(m => m.temperature);
    const humidityData = measurements.map(m => m.humidity);
    const absoluteHumidityData = measurements.map(m => m.absoluteHumidity);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temperatureData,
          borderColor: this.tempColor,
          backgroundColor: this.tempColor + '33',
          fill: true
        },
        {
          label: 'Humidity (%)',
          data: humidityData,
          borderColor: this.humColor,
          backgroundColor: this.humColor + '33',
          fill: true
        },
        {
          label: 'Absolute Humidity (g/m³)',
          data: absoluteHumidityData,
          borderColor: this.absHumColor,
          backgroundColor: this.absHumColor + '33',
          fill: true
        }
      ]
    };
  }

  getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

}
