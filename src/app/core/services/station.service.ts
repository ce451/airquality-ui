import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Station} from '../models/station.model';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private apiUrl = `${environment.apiBaseUrl}/stations`;
  constructor(private http: HttpClient) { }

  getAllStations(): Observable<Station[]> {
    console.log('apiUrl', this.apiUrl);
    return this.http
      .get<any>(`${this.apiUrl}`)
      .pipe(
        map(res => {
          console.log(res);
          return res || [] ;
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

  // groupAndOrderStations(stations: Station[]): Observable<Station[]> {
  //
  // }
}
