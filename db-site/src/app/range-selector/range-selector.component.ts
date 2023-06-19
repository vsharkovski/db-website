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
import { RangeMapService } from '../range-map.service';
import { RangeMappingType } from '../range-mapping.type';

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

  @Input() type: RangeMappingType = 'linear';

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  readonly defaultZoomFraction = 0.005;

  selectedElement: ElementName | null = null;
  mousePositionFraction: PixelCoordinate | null = null;
  isMouseInsideX = false;

  constructor(
    private mouseTracker: MouseTrackerDirective,
    private rangeMapService: RangeMapService
  ) {}

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

    let value = this.rangeMapService.mapFractionToValue(
      this.type,
      fraction,
      this.valueBoundary
    );
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
      const prevValue = this.rangeMapService.mapFractionToValue(
        this.type,
        prevFraction,
        this.valueBoundary
      );
      const valueDifference = prevValue - value;

      // Get new min and max values.
      const clampValue = (v: number): number =>
        Math.max(this.valueBoundary.min, Math.min(this.valueBoundary.max, v));

      const newMin = clampValue(this.selectedValues.min + valueDifference);
      const newMax = clampValue(this.selectedValues.max + valueDifference);

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

    const leftFraction = this.rangeMapService.mapValueToFraction(
      this.type,
      this.selectedValues.min,
      this.valueBoundary
    );
    const rightFraction = this.rangeMapService.mapValueToFraction(
      this.type,
      this.selectedValues.max,
      this.valueBoundary
    );

    // Calculate new selected boundaries.
    let newMin = this.rangeMapService.mapFractionToValue(
      this.type,
      leftFraction - changeFractionLeft,
      this.valueBoundary
    );
    let newMax = this.rangeMapService.mapFractionToValue(
      this.type,
      rightFraction + changeFractionRight,
      this.valueBoundary
    );

    // In case they pass each other, set them to the middle.
    if (newMin > newMax) {
      const middleFraction = (leftFraction + rightFraction) / 2;
      const middleValue = this.rangeMapService.mapFractionToValue(
        this.type,
        middleFraction,
        this.valueBoundary
      );
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

  getPercentageFromFraction(fraction: number): string {
    const result = Math.max(0, Math.min(100, 100 * fraction));
    return `${result}%`;
  }

  getPositionPercentageFromValue(value: number): string {
    return this.getPercentageFromFraction(
      this.rangeMapService.mapValueToFraction(
        this.type,
        value,
        this.valueBoundary
      )
    );
  }

  getSizePercentageFromValues(values: NumberRange): string {
    const sizeFraction =
      this.rangeMapService.mapValueToFraction(
        this.type,
        values.max,
        this.valueBoundary
      ) -
      this.rangeMapService.mapValueToFraction(
        this.type,
        values.min,
        this.valueBoundary
      );
    return this.getPercentageFromFraction(sizeFraction);
  }
}
