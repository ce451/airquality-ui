import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Station} from '../models/station.model';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private apiUrl = `${environment.apiBaseUrl}/stations`;

  constructor(private http: HttpClient) {
  }

  getAllStations(): Observable<Station[]> {
    return this.http
      .get<any>(`${this.apiUrl}`)
      .pipe(
        map(res => res || [])
      );
  }

  getAllStationsWithLatestMeasurement(): Observable<Station[]> {
    return this.http
      .get<any>(`${this.apiUrl}/latestMeasurement`)
      .pipe(
        map(res => res || [])
      );
  }

  getStationById(id: number): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  getStationByIdWithMeasurements(id: number, minutes?: number): Observable<Station> {
    let params = new HttpParams();
    if (minutes !== undefined) {
      params = params.set('minutes', minutes.toString());
    }
    return this.http.get<Station>(`${this.apiUrl}/${id}/measurements`, { params });
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
