import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class ThemeService {
  initTheme() {
    const theme = localStorage.getItem('theme') ?? 'dark';
    this.setTheme(theme);
  }

  toggleTheme() {
    const currentTheme = localStorage.getItem('theme') ?? 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(newTheme: string) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  get isDarkMode(): boolean {
    return localStorage.getItem('theme') === 'dark';
  }
}
