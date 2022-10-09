import { Component, Input, OnInit } from '@angular/core';
import { FigureSize } from '../figure-size.enum';

@Component({
  selector: 'dbw-figure',
  templateUrl: './figure.component.html',
  styleUrls: ['./figure.component.css'],
})
export class FigureComponent implements OnInit {
  readonly FigureSize = FigureSize;

  @Input() imageSource!: string;
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() size?: FigureSize = FigureSize.Normal;

  constructor() {}

  ngOnInit(): void {
    console.log('Figure size', this.size);
  }
}
