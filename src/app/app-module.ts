import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Dashbaord } from './features/pages/dashbaord/dashbaord';
import { StationDetail } from './features/pages/station-detail/station-detail';
import {provideHttpClient} from '@angular/common/http';
import { LastUpdatedPipe } from './shared/pipes/last-updated-pipe';
import { StationCard } from './shared/components/station-card/station-card';
import { ThemeToggle } from './shared/components/theme-toggle/theme-toggle';

@NgModule({
  declarations: [
    App,
    Dashbaord,
    StationDetail,
    LastUpdatedPipe,
    StationCard,
    ThemeToggle
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient()
  ],
  bootstrap: [App]
})
export class AppModule { }
