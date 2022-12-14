import { Component } from '@angular/core';
import FiguresDataFullJson from '../../assets/data/figures.json';
import { FigureData } from '../figure-data.model';

@Component({
  selector: 'dbw-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent {
  figures: FigureData[] = FiguresDataFullJson;
}
