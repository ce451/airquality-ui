import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {HttpClient} from '@angular/common/http';
import {map, Observable, timeout} from 'rxjs';
import {StationGroup} from 'src/app/core/models/station-group.model';
import {REQUEST_TIMEOUT_MS} from 'src/app/core/services/station.service';

@Injectable({
  providedIn: 'root'
})
export class StationGroupService {
  private apiUrl = `${environment.apiBaseUrl}/stationgroups`;

  constructor(private http: HttpClient) {
  }

  getAllStationGroups(): Observable<StationGroup[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        map(res => {
          return res || [];
        })
      );
  }

}
