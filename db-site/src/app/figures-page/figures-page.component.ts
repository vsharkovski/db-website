import { Component } from '@angular/core';
import { FigureData } from '../figure-data.model';
import FiguresDataFullJson from '../../assets/data/figures.json';
import { FigureSize } from '../figure-size.enum';

@Component({
  selector: 'dbw-figures-page',
  templateUrl: './figures-page.component.html',
  styleUrls: ['./figures-page.component.css'],
})
export class FiguresPageComponent {
  readonly FigureSize = FigureSize;

  figures: FigureData[] = FiguresDataFullJson;
}
