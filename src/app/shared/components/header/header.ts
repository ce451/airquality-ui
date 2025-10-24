import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  showBackButton: boolean = false;
  title: string = 'Air Quality Monitor';

  constructor(
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateHeaderState();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateHeaderState();
    });
  }

  private updateHeaderState(): void {
    const url = this.router.url;

    if (url.includes('/station/')) {
      this.showBackButton = true;
      this.title = 'Station Details';
    } else {
      this.showBackButton = false;
      this.title = 'Air Quality Monitor';
    }
  }

  goBack(): void {
    this.location.back();
  }
}
