import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {Dashbaord} from './features/pages/dashbaord/dashbaord';
import {StationService} from './core/services/station.service';

const routes: Routes = [
  { path: '', component: Dashbaord },
  { path: 'station/:id', component: StationService },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
