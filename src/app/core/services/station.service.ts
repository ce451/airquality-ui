import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, timeout} from 'rxjs';
import {Station} from '../models/station.model';
import {environment} from '@environments/environment';

// Hard per-request ceiling. The service worker's freshness strategy falls back
// to the cache after 3-5s, but when the cache has no entry it awaits the
// network indefinitely - without this, a dead link means an eternal spinner.
export const REQUEST_TIMEOUT_MS = 15000;

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
        timeout(REQUEST_TIMEOUT_MS),
        map(res => res || [])
      );
  }

  // Batch endpoint: every station with its recent (server-sampled) series in a
  // single response - one round-trip instead of one request per dashboard card.
  getAllStationsWithMeasurements(minutes: number, maxPoints?: number): Observable<Station[]> {
    return this.http
      .get<Station[]>(`${this.apiUrl}/measurements`, {params: this.seriesParams(minutes, maxPoints)})
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        map(res => res || [])
      );
  }

  getAllStationsWithLatestMeasurement(): Observable<Station[]> {
    return this.http
      .get<any>(`${this.apiUrl}/latestMeasurement`)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        map(res => res || [])
      );
  }

  getStationById(id: number): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`)
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  getStationByIdWithMeasurements(id: number, minutes?: number, maxPoints?: number): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}/measurements`, {params: this.seriesParams(minutes, maxPoints)})
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  private seriesParams(minutes?: number, maxPoints?: number): HttpParams {
    let params = new HttpParams();
    if (minutes !== undefined) {
      params = params.set('minutes', minutes.toString());
    }
    if (maxPoints !== undefined) {
      params = params.set('maxPoints', maxPoints.toString());
    }
    return params;
  }
}
