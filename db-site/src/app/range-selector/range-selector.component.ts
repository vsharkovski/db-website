import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
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

  @Input() type: 'linear' | 'log' = 'linear';

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  readonly defaultZoomFraction = 0.005;
  readonly logarithmicConstant = 0.001;

  selectedElement: ElementName | null = null;
  mousePositionFraction: PixelCoordinate | null = null;
  isMouseInsideX = false;

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
          this.updateSelection(
            fraction.x,
            prevFraction !== null ? prevFraction.x : null
          );
        }
      });
    this.mouseTracker.isInside$.subscribe(
      (isInside) => (this.isMouseInsideX = isInside.x)
    );
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

  updateSelection(fraction: number, prevFraction: number | null): void {
    if (!this.selectedElement) return;

    let value = this.getValueFromFraction(fraction);
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
      const prevValue = this.getValueFromFraction(prevFraction);
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
   * @param changeFraction Number in [0, 1], the fraction of the total value range
   * to change the selected value range by.
   */
  private doZoom(changeFraction: number) {
    let changeFractionLeft = changeFraction * 0.5;
    let changeFractionRight = changeFraction - changeFractionLeft;
    if (this.isMouseInsideX) {
      // Between the left and right endpoints of the selector.
      // Determine based on mouse position fraction.
      changeFractionLeft = changeFraction * this.mousePositionFraction!.x;
      changeFractionRight = changeFraction - changeFractionLeft;
    }

    const leftFraction = this.getFractionFromValue(this.selectedValues.min);
    const rightFraction = this.getFractionFromValue(this.selectedValues.max);

    // Calculate new selected boundaries.
    let newMin = this.getValueFromFraction(leftFraction - changeFractionLeft);
    let newMax = this.getValueFromFraction(rightFraction + changeFractionRight);

    // In case they pass each other, set them to the middle.
    if (newMin > newMax) {
      const middleFraction = (leftFraction + rightFraction) / 2;
      const middleValue = this.getValueFromFraction(middleFraction);
      newMin = middleValue;
      newMax = middleValue;
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

  clampFraction(fraction: number): number {
    return Math.max(0, Math.min(1, fraction));
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
   * @returns A number in range [this.valueBoundary.min, this.valueBoundary.max].
   */
  getValueFromFraction(fraction: number): number {
    let v;
    if (this.type === 'linear') {
      // Linear mapping.
      v =
        this.valueBoundary.min +
        fraction * (this.valueBoundary.max - this.valueBoundary.min + 1);
    } else {
      /*
      Logarithmic mapping.
      Formula is v=(1/k)*ln((e^kb-e^ka)f + e^ka), where
      a=valueBoundary.min, b=valueBoundary.max+1, k is a constant.
      We can't calculate this using floating-point arithmetic, but
      because a << -100, we have an approximation f~b+ln(x)/k.
      */
      v =
        this.valueBoundary.max +
        1 +
        Math.log(fraction) / this.logarithmicConstant;
    }
    return this.clampValue(Math.round(v));
  }

  /**
   *
   * @param value A number in range [this.valueBoundary.min, this.valueBoundary.max].
   * @returns A fraction in range [0, 1).
   */
  getFractionFromValue(value: number): number {
    let f;
    if (this.type === 'linear') {
      // Linear mapping.
      f =
        (value - this.valueBoundary.min) /
        (this.valueBoundary.max - this.valueBoundary.min + 1);
    } else {
      /*
      Logarithmic mapping.
      Same logic as in getValueFromFraction.
      */
      f = Math.exp(
        this.logarithmicConstant * (value - (this.valueBoundary.max + 1))
      );
    }
    return this.clampFraction(f);
  }

  getPositionPercentageFromValue(value: number): string {
    return this.getPercentageFromFraction(this.getFractionFromValue(value));
  }

  getSizePercentageFromValues(values: NumberRange): string {
    const sizeFraction =
      this.getFractionFromValue(values.max) -
      this.getFractionFromValue(values.min);
    return this.getPercentageFromFraction(sizeFraction);
  }
}
