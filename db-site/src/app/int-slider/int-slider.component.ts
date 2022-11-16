import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NumberRange } from '../number-range.model';

@Component({
  selector: 'dbw-int-slider',
  templateUrl: './int-slider.component.html',
  styleUrls: ['./int-slider.component.css'],
})
export class IntSliderComponent implements OnInit {
  @Input() numOptions!: number;
  @Input() limits!: NumberRange;
  @Input() range!: NumberRange;
  @Output() rangeChange = new EventEmitter<NumberRange>();

  constructor() {}

  ngOnInit(): void {
    if (this.range === undefined) {
      this.range = { min: this.limits.min, max: this.limits.max };
      this.rangeChange.emit(this.range);
    }
  }
}
