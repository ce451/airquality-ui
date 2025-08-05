import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Station} from '../models/station.model';
import {environment} from '@environments/environment';
import {StationGroup} from 'src/app/core/models/station-group.model';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private apiUrl = `${environment.apiBaseUrl}/stations`;

  constructor(private http: HttpClient) {
  }

  getAllStations(): Observable<Station[]> {
    console.log('apiUrl', this.apiUrl);
    return this.http
      .get<any>(`${this.apiUrl}`)
      .pipe(
        map(res => {
          console.log('stations:', res);
          return res || [];
        })
      );
  }

  getAllStationsWithLatestMeasurement(): Observable<Station[]> {
    return this.http
      .get<any>(`${this.apiUrl}/latestMeasurement`)
      .pipe(
        map(res => res || [])
      );
  }

  getStationById(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  getStationByIdWithMeasurements(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}/measurements`);
  }

  // groupAndOrderStations(stations: Station[]): StationGroupService[] {
  //   const groupMap = new Map<string, StationGroupService>();
  //
  //   for (const station of stations) {
  //     const groupName = station.roomGroup;
  //
  //     if (!groupMap.has(groupName)) {
  //       groupMap.set(groupName, {
  //         groupName: groupName,
  //         groupOrder: station.roomGroupOrder,
  //         stations: []
  //       });
  //     }
  //
  //     groupMap.get(groupName)!.stations.push(station);
  //   }
  //
  //   for (const group of groupMap.values()) {
  //     group.stations.sort((a, b) => a.displayOrder - b.displayOrder);
  //   }
  //
  //   return Array.from(groupMap.values()).sort((a, b) => a.groupOrder - b.groupOrder);
  // }
}
