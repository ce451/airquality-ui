import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Station} from 'src/app/core/models/station.model';
import {StationGroup} from 'src/app/core/models/station-group.model';

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
        map(res => {
          return res || [];
        })
      );
  }

}
