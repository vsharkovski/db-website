import { Component, Input } from '@angular/core';
import { FigureData } from '../figure-data.model';
import { FigureSize } from '../figure-size.enum';

@Component({
  selector: 'dbw-figure-carousel',
  templateUrl: './figure-carousel.component.html',
  styleUrls: ['./figure-carousel.component.css'],
})
export class FigureCarouselComponent {
  readonly FigureSize = FigureSize;
  @Input() figures!: FigureData[];
}
