import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {Dashbaord} from './features/pages/dashbaord/dashbaord';
import {StationDetail} from 'src/app/features/pages/station-detail/station-detail';

const routes: Routes = [
  { path: '', component: Dashbaord },
  { path: 'station/:id', component: StationDetail },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
