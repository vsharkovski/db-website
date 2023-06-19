import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NumberRange } from '../number-range.model';
import { MouseTrackerDirective } from '../mouse-tracker.directive';
import { PixelCoordinate } from '../pixel-coordinate.model';
import { pairwise, startWith } from 'rxjs';

type ElementName = 'left' | 'right' | 'bar';

@Component({
  selector: 'dbw-range-selector',
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css'],
  hostDirectives: [MouseTrackerDirective],
})
export class RangeSelectorComponent implements OnChanges, OnInit {
  @Input() minValue!: number;
  @Input() maxValue!: number;

  @Input() minValueSelected!: number;
  @Input() maxValueSelected!: number;

  // Whether to enable zoom when using mouse wheel *on the range selector itself.*
  @Input() enableZoomOnWheel: boolean = false;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  selectedElement: ElementName | null = null;
  mousePositionFraction: PixelCoordinate | null = null;
  isMouseInsideX = false;

  @ViewChild('selector') selectorElementRef?: ElementRef;

  constructor(private mouseTracker: MouseTrackerDirective) {}

  ngOnChanges(): void {
    // If selected values are not provided, set them to the boundaries.
    if (this.minValueSelected === undefined) {
      this.minValueSelected = this.minValue;
    }
    if (this.maxValueSelected === undefined) {
      this.maxValueSelected = this.maxValue;
    }
  }

  ngOnInit(): void {
    this.mouseTracker.currentFraction$
      .pipe(startWith(null), pairwise())
      .subscribe(([fraction, prevFraction]) => {
        this.mousePositionFraction = fraction;
        if (fraction !== null && fraction.x >= 0 && fraction.x < 1) {
          this.isMouseInsideX = true;
          this.updateSelection(fraction, prevFraction);
        } else {
          this.isMouseInsideX = false;
        }
      });
  }

  onMouseDown(element: ElementName): void {
    this.selectedElement = element;
  }

  onClick(side: 'left' | 'right'): void {
    let didUpdate = false;
    if (side === 'left') {
      if (this.minValueSelected - 1 >= this.minValue) {
        this.minValueSelected -= 1;
        didUpdate = true;
      }
    } else {
      if (this.maxValueSelected + 1 <= this.maxValue) {
        this.maxValueSelected += 1;
        didUpdate = true;
      }
    }
    if (didUpdate) {
      this.selectionChanged.next({
        min: this.minValueSelected,
        max: this.maxValueSelected,
      });
    }
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    if (this.selectedElement) {
      this.selectedElement = null;
    }
  }

  updateSelection(
    fraction: PixelCoordinate,
    prevFraction: PixelCoordinate | null
  ): void {
    if (!this.selectedElement) return;

    let value = this.getValueFromPositionFraction(fraction.x);
    let updatedAnySelected = false;

    if (this.selectedElement == 'left') {
      // Update min selected value if new.
      if (this.maxValueSelected < value) value = this.maxValueSelected;
      updatedAnySelected = value != this.minValueSelected;
      this.minValueSelected = value;
    } else if (this.selectedElement == 'right') {
      // Update max selected value if new.
      if (value < this.minValueSelected) value = this.minValueSelected;
      updatedAnySelected = value != this.maxValueSelected;
      this.maxValueSelected = value;
    } else if (prevFraction !== null) {
      // Bar. Move both min and max selected values, if it would not decrease range size.

      // Get value from previous mouse position. Use it to calculate the difference
      // in values that the mouse movement would cause.
      const prevValue = this.getValueFromPositionFraction(prevFraction.x);
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
        updatedAnySelected = true;
      }
    }

    if (updatedAnySelected) {
      this.selectionChanged.next({
        min: this.minValueSelected,
        max: this.maxValueSelected,
      });
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.enableZoomOnWheel) {
      const amount = 0.5 * (event.deltaX + event.deltaY + event.deltaZ);
      this.doZoom(amount);

      // Prevent default scrolling behavior to keep the screen in place.
      event.preventDefault();
      event.stopPropagation();
    }
  }

  doZoom(amount: number) {
    if (!this.selectorElementRef) return;

    // Determine how much to move the left and right ticks.
    let amountLeft = Math.round(amount * 0.5);
    let amountRight = amount - amountLeft;

    if (this.isMouseInsideX) {
      // Between the left and right endpoints of the selector. Determine amount dynamically.
      amountLeft = Math.round(amount * this.mousePositionFraction!.x);
      amountRight = amount - amountLeft;
    }

    // If zooming out, swap them.
    // if (amount >= 0) {
    //   [amountLeft, amountRight] = [amountRight, amountLeft];
    // }

    // Move left and right ticks by updating their values.
    let newMin = this.clampValue(this.minValueSelected - amountLeft);
    let newMax = this.clampValue(this.maxValueSelected + amountRight);

    // In case they pass each other, set them to the middle.
    if (newMin > newMax) {
      const middle = Math.round(
        (this.minValueSelected + this.maxValueSelected) / 2
      );
      newMin = middle;
      newMax = middle;
    }

    // Update selected values.
    this.minValueSelected = newMin;
    this.maxValueSelected = newMax;
    this.selectionChanged.emit({ min: newMin, max: newMax });
  }

  clampValue(value: number): number {
    return Math.max(this.minValue, Math.min(this.maxValue, value));
  }

  getPercentageFromFraction(fraction: number): string {
    const result = Math.max(0, Math.min(100, 100 * fraction));
    return `${result}%`;
  }

  /**
   * @param fraction Number in [0, 1).
   */
  getValueFromPositionFraction(fraction: number): number {
    return Math.round(
      this.minValue + fraction * (this.maxValue - this.minValue)
    );
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
}
