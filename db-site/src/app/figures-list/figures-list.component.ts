import { Component, Input } from '@angular/core';
import { FigureData } from '../figure-data.model';
import { FigureSize } from '../figure-size.enum';

@Component({
  selector: 'dbw-figures-list',
  templateUrl: './figures-list.component.html',
  styleUrls: ['./figures-list.component.css'],
})
export class FiguresListComponent {
  @Input() figures!: FigureData[];
  @Input() figureSize?: FigureSize;
}
