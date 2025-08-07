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
        beginAtZero: false,
      },
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
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true
        },
        {
          label: 'Humidity (%)',
          data: humidityData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true
        },
        {
          label: 'Absolute Humidity (g/m³)',
          data: absoluteHumidityData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true
        }
      ]
    };
  }
}
