import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {Dashbaord} from './features/pages/dashbaord/dashbaord';
import {StationDetail} from 'src/app/features/pages/station-detail/station-detail';

const routes: Routes = [
  { path: '', component: Dashbaord, data: { reuse: true } },
  { path: 'station/:id', component: StationDetail },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Restore the previous scroll position on back/forward (popstate); the
    // dashboard's in-app back button uses Location.back(), so this applies. New
    // forward navigations scroll to the top. Works together with the reused
    // dashboard view (see AppRouteReuseStrategy) so the grid is already at full
    // height when the position is restored.
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
