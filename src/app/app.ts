import { Component } from '@angular/core';
import {ThemeService} from 'src/app/core/services/theme.service';
import {SwUpdateService} from 'src/app/core/services/sw-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected title = 'LC\'s Air Quality Monitor';

  constructor(private themeService: ThemeService, private swUpdateService: SwUpdateService) { }

  ngOnInit() {
    this.themeService.initTheme();
    this.swUpdateService.init();
  }
}
