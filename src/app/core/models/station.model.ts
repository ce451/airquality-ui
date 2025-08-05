import {Measurement} from './measurement.model';

export class Station {
  id!: number;
  name!: string;
  ipAddress!: string;
  status!: string;
  stationGroupId!: number;
  displayOrder!: number;
  measurements!: Measurement[];
}
