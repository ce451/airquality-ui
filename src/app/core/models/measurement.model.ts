export class Measurement {
    // Only present on WebSocket messages (MeasurementWithStationDto). REST
    // series responses use the compact point shape without id/stationId.
    id?: string; // UUID from backend
    stationId?: number;
    temperature!: number;
    humidity!: number;
    absoluteHumidity!: number;
    timestamp!: Date;
  }
