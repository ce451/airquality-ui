export class Measurement {
    id!: string; // UUID from backend
    stationId!: number;
    temperature!: number;
    humidity!: number;
    absoluteHumidity!: number;
    timestamp!: Date;

    constructor() {}

    // constructor(
    //   id: number,
    //   temperature: number,
    //   humidity: number,
    //   absoluteHumidity: number,
    //   timestamp: Date
    // ) {
    //   this.id = id;
    //   this.temperature = temperature;
    //   this.humidity = humidity;
    //   this.absoluteHumidity = absoluteHumidity;
    //   this.timestamp = timestamp;
    // }
  }
