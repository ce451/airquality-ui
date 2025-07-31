import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  standalone: false,
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss'
})
export class ThemeToggle implements OnInit {
  isDarkMode = false;

  ngOnInit() {
    const theme = localStorage.getItem('theme') ?? 'dark';
    this.isDarkMode = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
}
