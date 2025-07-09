import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Dashbaord } from './features/pages/dashbaord/dashbaord';
import { StationDetail } from './features/pages/station-detail/station-detail';

@NgModule({
  declarations: [
    App,
    Dashbaord,
    StationDetail
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
