import {Component, Input} from '@angular/core';
import {Station} from 'src/app/core/models/station.model';

@Component({
  selector: 'app-station-card',
  standalone: false,
  templateUrl: './station-card.html',
  styleUrl: './station-card.scss'
})
export class StationCard {
  @Input() station!: Station;
}
