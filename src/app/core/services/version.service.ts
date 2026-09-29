import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, of, timeout} from 'rxjs';
import {environment} from '@environments/environment';
import {REQUEST_TIMEOUT_MS} from './station.service';
import {version} from '../../../../package.json';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  // Baked in at build time from package.json - bump it there with each change.
  readonly uiVersion: string = version;

  constructor(private http: HttpClient) {
  }

  // The API answers GET /version with its spring.application.version as plain
  // text. null when it can't be reached (offline, older API) - not cached by
  // the service worker, so offline this is null rather than a stale number.
  getApiVersion(): Observable<string | null> {
    return this.http
      .get(`${environment.apiBaseUrl}/version`, {responseType: 'text'})
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of(null))
      );
  }
}
