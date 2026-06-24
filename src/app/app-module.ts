import { NgModule, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Dashbaord } from './features/pages/dashbaord/dashbaord';
import { StationDetail } from './features/pages/station-detail/station-detail';
import {provideHttpClient} from '@angular/common/http';
import { LastUpdatedPipe } from './shared/pipes/last-updated-pipe';
import { StationCard } from './shared/components/station-card/station-card';
import { ThemeToggle } from './shared/components/theme-toggle/theme-toggle';
import { NgChartsModule } from 'ng2-charts';
import { LoadingSpinner } from './shared/components/loading-spinner/loading-spinner';
import { Header } from './shared/components/header/header';
import { ServiceWorkerModule } from '@angular/service-worker';
import { RouteReuseStrategy } from '@angular/router';
import { AppRouteReuseStrategy } from './core/app-route-reuse-strategy';

@NgModule({
  declarations: [
    App,
    Dashbaord,
    StationDetail,
    LastUpdatedPipe,
    StationCard,
    ThemeToggle,
    LoadingSpinner,
    Header
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgChartsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
  ],
  bootstrap: [App]
})
export class AppModule { }
