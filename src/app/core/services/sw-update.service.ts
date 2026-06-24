import {Injectable} from '@angular/core';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {filter} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {
  private lastCheck = 0;

  constructor(private swUpdate: SwUpdate) {
  }

  init() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        if (confirm('A new version is available. Reload now?')) {
          document.location.reload();
        }
      });

    // The app is mostly reopened from the Android home screen; reuse the
    // same visibility signal the pages already use for data refresh.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Throttle: a focus flicker shouldn't fire an ngsw.json fetch on every
        // return and compete with the data refresh on a sleepy radio.
        const now = Date.now();
        if (now - this.lastCheck < 60000) {
          return;
        }
        this.lastCheck = now;
        this.swUpdate.checkForUpdate().catch(() => {});
      }
    });
  }
}
