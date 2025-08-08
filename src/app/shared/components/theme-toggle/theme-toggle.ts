import { Component, OnInit } from '@angular/core';
import {StationService} from 'src/app/core/services/station.service';
import {ThemeService} from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: false,
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss'
})
export class ThemeToggle implements OnInit {
  isDarkMode = false;

  constructor(private themeService: ThemeService) { }

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDarkMode;
    // this.isDarkMode = !this.isDarkMode;
    // const newTheme = this.isDarkMode ? 'dark' : 'light';
    // document.documentElement.setAttribute('data-theme', newTheme);
    // localStorage.setItem('theme', newTheme);
  }
}
