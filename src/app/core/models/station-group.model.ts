import {Station} from 'src/app/core/models/station.model';

export class StationGroup {
  id!: number;
  displayName!: string;
  displayOrder!: number;
  active!: boolean;
  stations!: Station[];
}
