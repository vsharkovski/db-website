import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NumberRange } from '../number-range.model';

type ElementName = 'left' | 'right' | 'bar';

@Component({
  selector: 'dbw-range-selector',
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css'],
})
export class RangeSelectorComponent implements OnInit {
  @Input() minValue!: number;
  @Input() maxValue!: number;

  @Input() minValueSelected!: number;
  @Input() maxValueSelected!: number;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  selectedElement: ElementName | null = null;

  @ViewChild('selector') selectorElementRef?: ElementRef;

  constructor() {}

  ngOnInit(): void {
    // If selected values are not provided, set them to the boundaries.
    if (this.minValueSelected === undefined) {
      this.minValueSelected = this.minValue;
    }
    if (this.maxValueSelected === undefined) {
      this.maxValueSelected = this.maxValue;
    }
  }

  onMouseDown(element: ElementName) {
    this.selectedElement = element;
    // console.log('Selected element', element);
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.selectedElement) {
      this.selectedElement = null;
      // console.log('Deselected');
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.selectedElement || !this.selectorElementRef) return;

    const selectorBoundingBox =
      this.selectorElementRef.nativeElement.getBoundingClientRect();

    // X position of selector on the page. Takes scrolling into account.
    const selectorPositionX = selectorBoundingBox.x + window.scrollX;

    const getValueFromPageX = (pageX: number): number => {
      // Get difference between the X and selector X position (both page coordinates),
      // as a fraction of the size of the selector.
      let fraction = (pageX - selectorPositionX) / selectorBoundingBox.width;

      // Get value using the fraction.
      // Round, clamp, and return it.
      let value = this.minValue + fraction * (this.maxValue - this.minValue);
      return this.clampValue(Math.round(value));
    };

    // Get new value.
    let value = getValueFromPageX(event.pageX);

    if (this.selectedElement == 'left') {
      // Update min selected value if below max selected.
      if (value <= this.maxValueSelected) {
        this.minValueSelected = value;
      }
    } else if (this.selectedElement == 'right') {
      // Update max selected value if above min selected.
      if (this.minValueSelected <= value) {
        this.maxValueSelected = value;
      }
    } else {
      // Bar. Move both min and max selected values, if it would not decrease range size.

      // Get value from previous mouse position. Use it to calculate the difference
      // in values that the mouse movement would cause.
      const prevValue = getValueFromPageX(event.pageX + event.movementX);
      const valueDifference = prevValue - value;

      // Get new min and max values.
      const newMin = this.clampValue(this.minValueSelected + valueDifference);
      const newMax = this.clampValue(this.maxValueSelected + valueDifference);

      // Get range sizes. Only update min and max selected if they are the same.
      const prevRangeSize = this.maxValueSelected - this.minValueSelected;
      const rangeSize = newMax - newMin;

      if (rangeSize == prevRangeSize) {
        this.minValueSelected = newMin;
        this.maxValueSelected = newMax;
      }
    }
  }

  getPercentageFromFraction(fraction: number): string {
    const result = Math.max(0, Math.min(100, 100 * fraction));
    return `${result}%`;
  }

  getPositionFractionFromValue(value: number): number {
    return (value - this.minValue) / (this.maxValue - this.minValue);
  }

  getPositionPercentageFromValue(value: number): string {
    return this.getPercentageFromFraction(
      this.getPositionFractionFromValue(value)
    );
  }

  getSizePercentageFromValues(min: number, max: number): string {
    const sizeFraction =
      this.getPositionFractionFromValue(max) -
      this.getPositionFractionFromValue(min);
    return this.getPercentageFromFraction(sizeFraction);
  }

  clampValue(value: number): number {
    return Math.max(this.minValue, Math.min(this.maxValue, value));
  }
}
