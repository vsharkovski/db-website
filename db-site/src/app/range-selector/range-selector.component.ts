import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NumberRange } from '../number-range.model';

@Component({
  selector: 'dbw-range-selector',
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css'],
})
export class RangeSelectorComponent implements OnInit {
  @Input() minValue!: number;
  @Input() maxValue!: number;

  minValueSelected!: number;
  maxValueSelected!: number;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  constructor() {}

  ngOnInit(): void {
    this.minValueSelected = this.minValue;
    this.maxValueSelected = this.maxValue;
  }

  getPercentageFromFraction(fraction: number): string {
    let result = Math.round(100 * fraction);
    result = Math.max(0, result);
    result = Math.min(result, 100);
    return `${result}%`;
  }

  getPositionFraction(value: number): number {
    return (value - this.minValue) / (this.maxValue - this.minValue);
  }

  getPositionPercentage(value: number): string {
    return this.getPercentageFromFraction(this.getPositionFraction(value));
  }

  getSizePercentage(min: number, max: number): string {
    const sizeFraction =
      this.getPositionFraction(max) - this.getPositionFraction(min);
    return this.getPercentageFromFraction(sizeFraction);
  }
}
