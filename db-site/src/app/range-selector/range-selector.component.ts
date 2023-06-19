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
  @Input() valueBoundary!: NumberRange;
  @Input() selectedValues!: NumberRange;

  // Whether to enable zoom when using mouse wheel *on the range selector itself.*
  @Input() enableZoomOnWheel: boolean = false;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  readonly defaultZoomFraction = 0.005;

  selectedElement: ElementName | null = null;
  mousePositionFraction: PixelCoordinate | null = null;
  isMouseInsideX = false;

  @ViewChild('selector') selectorElementRef?: ElementRef;

  constructor(private mouseTracker: MouseTrackerDirective) {}

  ngOnChanges(): void {
    // If selected values are not provided, set them to the boundaries.
    if (!this.selectedValues) {
      this.selectedValues = this.valueBoundary;
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
    let newSelectedValues: NumberRange = { ...this.selectedValues };

    if (side === 'left') {
      if (this.selectedValues.min - 1 >= this.valueBoundary.min) {
        newSelectedValues.min -= 1;
        didUpdate = true;
      }
    } else {
      if (this.selectedValues.max + 1 <= this.valueBoundary.max) {
        newSelectedValues.max += 1;
        didUpdate = true;
      }
    }

    if (didUpdate) {
      this.selectedValues = newSelectedValues;
      this.selectionChanged.next(this.selectedValues);
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
    let newSelectedValues: NumberRange = { ...this.selectedValues };

    if (this.selectedElement == 'left') {
      // Update min selected value if new.
      if (this.selectedValues.max < value) value = this.selectedValues.max;
      updatedAnySelected = value != this.selectedValues.min;
      newSelectedValues.min = value;
    } else if (this.selectedElement == 'right') {
      // Update max selected value if new.
      if (value < this.selectedValues.min) value = this.selectedValues.min;
      updatedAnySelected = value != this.selectedValues.max;
      newSelectedValues.max = value;
    } else if (prevFraction !== null) {
      // Bar. Move both min and max selected values, if it would not decrease range size.

      // Get value from previous mouse position. Use it to calculate the difference
      // in values that the mouse movement would cause.
      const prevValue = this.getValueFromPositionFraction(prevFraction.x);
      const valueDifference = prevValue - value;

      // Get new min and max values.
      const newMin = this.clampValue(this.selectedValues.min + valueDifference);
      const newMax = this.clampValue(this.selectedValues.max + valueDifference);

      // Get range sizes. Only update min and max selected if they are the same.
      const prevRangeSize = this.selectedValues.max - this.selectedValues.min;
      const rangeSize = newMax - newMin;

      if (rangeSize == prevRangeSize) {
        newSelectedValues = { min: newMin, max: newMax };
        updatedAnySelected = true;
      }
    }

    if (updatedAnySelected) {
      this.selectedValues = newSelectedValues;
      this.selectionChanged.next(this.selectedValues);
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.enableZoomOnWheel) {
      this.doZoomDefault(Math.sign(event.deltaX + event.deltaY + event.deltaZ));

      // Prevent default scrolling behavior to keep the screen in place.
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Zoom in/out the selected range.
   * @param direction The direction (< 0 means expand, > 0 means shrink,
   * 0 means no change).
   */
  doZoomDefault(direction: number): void {
    this.doZoom(this.defaultZoomFraction * Math.sign(direction));
  }

  /**
   * Zoom in/out the selected range.
   * @param fraction Number in [0, 1], the fraction of the total value range
   * to change the selected value range by.
   */
  private doZoom(fraction: number) {
    if (!this.selectorElementRef) return;

    // Determine how much to move the left and right ticks.
    let fractionLeft = fraction * 0.5;
    let fractionRight = fraction - fractionLeft;

    if (this.isMouseInsideX) {
      // Between the left and right endpoints of the selector. Determine amount dynamically.
      fractionLeft = fraction * this.mousePositionFraction!.x;
      fractionRight = fraction - fractionLeft;
    }

    // Move left and right ticks by updating their values.
    const func = (x: number): number =>
      100 * Math.exp((-x - this.valueBoundary.min) / 2000);

    const valueBoundarySize =
      this.valueBoundary.max - this.valueBoundary.min + 1;

    let amountLeft = Math.round(fractionLeft * valueBoundarySize);
    let amountRight = Math.round(fractionRight * valueBoundarySize);

    let newMin = this.clampValue(this.selectedValues.min - amountLeft);
    let newMax = this.clampValue(this.selectedValues.max + amountRight);

    // In case they pass each other, set them to the middle.
    if (newMin > newMax) {
      const middle = Math.round(
        (this.selectedValues.min + this.selectedValues.max) / 2
      );
      newMin = middle;
      newMax = middle;
    }

    // Update selected values.
    if (
      newMin != this.selectedValues.min ||
      newMax != this.selectedValues.max
    ) {
      this.selectedValues = { min: newMin, max: newMax };
      this.selectionChanged.emit(this.selectedValues);
    }
  }

  clampValue(value: number): number {
    return Math.max(
      this.valueBoundary.min,
      Math.min(this.valueBoundary.max, value)
    );
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
      this.valueBoundary.min +
        fraction * (this.valueBoundary.max - this.valueBoundary.min + 1)
    );
  }

  getPositionFractionFromValue(value: number): number {
    return (
      (value - this.valueBoundary.min) /
      (this.valueBoundary.max - this.valueBoundary.min + 1)
    );
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
