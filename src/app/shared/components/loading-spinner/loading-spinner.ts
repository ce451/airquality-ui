import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: false,
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss',
})
export class LoadingSpinner {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string = 'Loading...';
  @Input() overlay: boolean = false;
}
