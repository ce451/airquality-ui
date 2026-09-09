import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lastUpdated',
  standalone: false
})
export class LastUpdatedPipe implements PipeTransform {

  // The pipe is pure, so it only re-runs when an argument changes. Callers
  // pass `now` from ClockService.now$ (via async pipe) - that 30s tick is what
  // keeps the displayed age moving while the timestamp itself stays the same.
  transform(value: string | Date, now?: number | null): string {
    if (!value) return '';

    const time = new Date(value).getTime();
    const diffMs = (now ?? Date.now()) - time;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `right now`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

}
