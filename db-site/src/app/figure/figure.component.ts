import { LocationStrategy } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FigureSize } from '../figure-size.enum';

@Component({
  selector: 'dbw-figure',
  templateUrl: './figure.component.html',
  styleUrls: ['./figure.component.css'],
})
export class FigureComponent {
  readonly FigureSize = FigureSize;
  readonly baseHref: string = '';

  @Input() imageSource!: string;
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() size?: FigureSize = FigureSize.Normal;

  constructor(private locationStrategy: LocationStrategy) {
    const href = this.locationStrategy.getBaseHref();
    if (href !== '/') {
      this.baseHref = this.locationStrategy.getBaseHref();
    }
  }
}
