import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Station} from '../models/station.model';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private apiUrl = `${environment.apiBaseUrl}/stations`;
  constructor(private http: HttpClient) { }

  getAllStations(): Observable<Station[]> {
    return this.http.get<Station[]>(`${environment.apiBaseUrl}/stations`);
  }

  getAllStationsWithLatestMeasurement(): Observable<Station[]> {
    return this.http.get<Station[]>(`${environment.apiBaseUrl}/stations/latestMeasurement`);
  }

  getStationById(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  getStationByIdWithMeasurements(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}/measurements`);
  }


}
