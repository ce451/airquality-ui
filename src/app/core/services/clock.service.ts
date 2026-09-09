import {Injectable} from '@angular/core';
import {map, Observable, shareReplay, timer} from 'rxjs';

/**
 * Shared 30s wall-clock tick for relative-time display ("x min ago"). The
 * async-pipe subscription in the templates keeps change detection ticking, so
 * the stamps keep aging even when no new data arrives (offline/stale) - a pure
 * pipe fed only by the timestamp would freeze at its first rendering, which is
 * exactly wrong for a staleness indicator. refCount stops the timer when
 * nothing on screen displays an age.
 */
@Injectable({providedIn: 'root'})
export class ClockService {
  readonly now$: Observable<number> = timer(0, 30_000).pipe(
    map(() => Date.now()),
    shareReplay({bufferSize: 1, refCount: true})
  );
}
