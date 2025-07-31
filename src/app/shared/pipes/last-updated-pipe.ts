import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lastUpdated',
  standalone: false
})
export class LastUpdatedPipe implements PipeTransform {

  transform(value: string | Date): string {
    if (!value) return '';

    const time = new Date(value).getTime();
    const now = Date.now();
    const diffMs = now - time;
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
