import {Injectable, NgZone} from '@angular/core';
import {Observable, shareReplay} from 'rxjs';

/**
 * Shared 30s wall-clock tick for relative-time display ("x min ago") and the
 * dashboard's stale-data marker. The async-pipe subscription in the templates
 * keeps change detection ticking, so the stamps keep aging even when no new
 * data arrives (offline/stale) - a pure pipe fed only by the timestamp would
 * freeze at its first rendering, which is exactly wrong for a staleness
 * indicator. refCount stops the timer when nothing on screen displays an age.
 *
 * The interval is scheduled outside the Angular zone (like the STOMP client):
 * a permanently pending interval inside it would keep ApplicationRef.isStable
 * false, delaying the 'registerWhenStable' SW registration to its 30s timeout.
 * Each tick re-enters the zone so change detection still runs.
 */
@Injectable({providedIn: 'root'})
export class ClockService {
  readonly now$: Observable<number>;

  constructor(zone: NgZone) {
    this.now$ = new Observable<number>(subscriber => {
      const tick = () => zone.run(() => subscriber.next(Date.now()));
      tick();
      const id = zone.runOutsideAngular(() => setInterval(tick, 30_000));
      return () => clearInterval(id);
    }).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
