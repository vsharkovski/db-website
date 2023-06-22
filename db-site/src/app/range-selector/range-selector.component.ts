import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NumberRange } from '../number-range.model';
import { MouseTrackerDirective } from '../mouse-tracker.directive';
import { PixelPair } from '../pixel-pair.model';
import { RangeMapService } from '../range-map.service';
import { RangeMappingType } from '../range-mapping.type';
import { ReplaySubject, distinctUntilChanged, filter, map } from 'rxjs';

type ElementName = 'left' | 'right' | 'bar';

@Component({
  selector: 'dbw-range-selector',
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css'],
  hostDirectives: [MouseTrackerDirective],
})
export class RangeSelectorComponent implements OnChanges, OnInit {
  readonly defaultZoomFraction = 0.005;

  @Input() valueBoundary!: NumberRange;
  @Input('selectedValues') selectedValuesInjected!: NumberRange;
  @Input() type: RangeMappingType = 'linear';

  // Whether to enable zoom when using mouse wheel *on the range selector itself.*
  @Input() enableZoomOnWheel: boolean = false;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  selectedFractions$ = new ReplaySubject<NumberRange>();
  selectedFractions!: NumberRange;

  // Always calculated from selectedFractions.
  selectedValues!: NumberRange;

  clickedElement: ElementName | null = null;
  mousePositionFraction: PixelPair | null = null;
  isMouseInsideX = false;

  barMoveStartFraction: number | null = null;
  barMoveStartSelectedFractions: NumberRange | null = null;

  constructor(
    private mouseTracker: MouseTrackerDirective,
    private rangeMapService: RangeMapService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['valueBoundary'] ||
      (changes['selectedValuesInjected'] &&
        (this.selectedValuesInjected.min !== this.selectedValues.min ||
          this.selectedValuesInjected.max !== this.selectedValues.max))
    ) {
      // Either boundaries changed, or selectedValues actually changed.
      this.selectedFractions =
        this.rangeMapService.mapValueRangeToFractionRange(
          this.type,
          this.selectedValuesInjected,
          this.valueBoundary
        );
      this.selectedValues = { ...this.selectedValuesInjected };
      this.clickedElement = null;
      this.barMoveStartFraction = null;
      this.barMoveStartSelectedFractions = null;
    }
  }

  ngOnInit(): void {
    // Update selection from mouse movement.
    this.mouseTracker.currentFraction$.subscribe((fraction) => {
      this.mousePositionFraction = fraction;
      if (fraction !== null && fraction.x >= 0 && fraction.x < 1) {
        this.updateSelection(fraction.x);
      }
    });

    // Track whether inside the component.
    this.mouseTracker.isInside$.subscribe(
      (isInside) => (this.isMouseInsideX = isInside.x)
    );

    // Update selectedFractions and selectedValues.
    const jsonCompare = (a: any, b: any): boolean =>
      JSON.stringify(a) === JSON.stringify(b);

    this.selectedFractions$.subscribe(
      (fractions) => (this.selectedFractions = fractions)
    );
    this.selectedFractions$
      .pipe(
        map((fractions) =>
          this.rangeMapService.mapFractionRangeToValueRange(
            this.type,
            fractions,
            this.valueBoundary,
            0,
            0
          )
        ),
        distinctUntilChanged(jsonCompare),
        filter((values) => values != this.selectedValues)
      )
      .subscribe((selectedValues) => {
        this.selectedValues = selectedValues;
        this.selectionChanged.next(selectedValues);
      });
  }

  onMouseDown(element: ElementName): void {
    this.clickedElement = element;
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    if (this.clickedElement) {
      this.clickedElement = null;
      this.barMoveStartFraction = null;
      this.barMoveStartSelectedFractions = null;

      // Round selectedFractions to match selectedValues.
      this.selectedFractions = this.rangeMapService.roundFractionRange(
        this.type,
        this.selectedFractions,
        this.valueBoundary,
        0,
        0
      );
    }
  }

  onClick(side: 'left' | 'right'): void {
    let newValues: NumberRange = { ...this.selectedValues };
    if (side === 'left') {
      newValues.min -= 1;
    } else {
      newValues.max += 1;
    }
    const newFractions = this.rangeMapService.mapValueRangeToFractionRange(
      this.type,
      newValues,
      this.valueBoundary
    );
    this.selectedFractions$.next(newFractions);
  }

  updateSelection(fraction: number): void {
    if (!this.clickedElement) return;
    let newSelectedFractions: NumberRange = { ...this.selectedFractions };

    if (this.clickedElement === 'left' || this.clickedElement === 'right') {
      this.barMoveStartFraction = null;
      this.barMoveStartSelectedFractions = null;

      // Move the selected endpoint by setting its value to the fraction's value.
      if (this.clickedElement == 'left') {
        if (this.selectedFractions.max < fraction)
          fraction = this.selectedFractions.max;
        newSelectedFractions.min = fraction;
      } else if (this.clickedElement == 'right') {
        if (fraction < this.selectedFractions.min)
          fraction = this.selectedFractions.min;
        newSelectedFractions.max = fraction;
      }
    } else {
      // Bar. Move both endpoints of selected range.
      if (this.barMoveStartFraction === null) {
        this.barMoveStartFraction = fraction;
        this.barMoveStartSelectedFractions = this.selectedFractions;
      } else {
        const shiftedFractions =
          this.rangeMapService.shiftFractionRangeByFractionDifference(
            this.barMoveStartSelectedFractions!,
            fraction - this.barMoveStartFraction
          );

        // Update selectedFractions if range size is the same.
        const shiftedSize = shiftedFractions.max - shiftedFractions.min;
        const selectedSize =
          this.selectedFractions.max - this.selectedFractions.min;

        if (Math.abs(shiftedSize - selectedSize) < Number.EPSILON) {
          newSelectedFractions = shiftedFractions;
        }
      }
    }

    this.selectedFractions$.next(newSelectedFractions);
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
   * Zoom in/out the selected range by a default amount.
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

    const fractionsRounded = this.rangeMapService.mapValueRangeToFractionRange(
      this.type,
      this.selectedValues,
      this.valueBoundary
    );

    const changedFractions: NumberRange = {
      min: fractionsRounded.min - changeFractionLeft,
      max: fractionsRounded.max + changeFractionRight,
    };

    // In case they pass each other, set them to the middle.
    let setToMiddle = false;
    if (changedFractions.min > changedFractions.max) {
      setToMiddle = true;
      const middle = (fractionsRounded.min + fractionsRounded.max) / 2;
      changedFractions.min = middle;
      changedFractions.max = middle;
    }

    let newValues = this.rangeMapService.mapFractionRangeToValueRange(
      this.type,
      changedFractions,
      this.valueBoundary,
      0,
      0
    );

    if (
      !setToMiddle &&
      newValues.min === this.selectedValues.min &&
      newValues.max === this.selectedValues.max
    ) {
      // Fraction ranges were too close to change the values.
      // Force a minimal change (at most 1 from each side).
      const clamp = (x: number) =>
        this.rangeMapService.clamp(x, this.valueBoundary);
      const candidate: NumberRange = {
        min: clamp(newValues.min - Math.sign(changeFractionLeft)),
        max: clamp(newValues.max + Math.sign(changeFractionRight)),
      };
      if (candidate.min > candidate.max) {
        // Zoomed inward and went from [i, i+1] to [i+1, i].
        candidate.max = candidate.min;
      }
      newValues = candidate;
    }

    const newFractions = this.rangeMapService.mapValueRangeToFractionRange(
      this.type,
      newValues,
      this.valueBoundary
    );
    this.selectedFractions$.next(newFractions);
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
