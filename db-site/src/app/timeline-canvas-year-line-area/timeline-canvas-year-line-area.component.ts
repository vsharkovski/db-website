import { Component, Input, OnChanges } from '@angular/core';
import { NumberRange } from '../number-range.model';
import { PixelPair } from '../pixel-pair.model';
import { RangeMapService } from '../range-map.service';
import { TimelineDrawParams } from '../timeline-draw-params.model';
import { TimelineService } from '../timeline.service';

@Component({
  selector: 'dbw-timeline-canvas-year-line-area',
  templateUrl: './timeline-canvas-year-line-area.component.html',
  styleUrls: ['./timeline-canvas-year-line-area.component.css'],
})
export class TimelineCanvasYearLineAreaComponent implements OnChanges {
  @Input() selectedYears!: NumberRange;
  @Input() drawParams!: TimelineDrawParams | null;
  @Input() mousePosition!: PixelPair | null;
  @Input() lastInsideMousePosition!: PixelPair | null;

  mouseYears: NumberRange | null = null;

  constructor(
    private rangeMapService: RangeMapService,
    private timelineService: TimelineService
  ) {}

  ngOnChanges(): void {
    if (this.lastInsideMousePosition) {
      const newMouseYears = this.getTimeRangeFromPosition(
        this.lastInsideMousePosition
      );
      if (newMouseYears) this.mouseYears = newMouseYears;
    }
  }

  /**
   * Returns the time range which the bucket index corresponds to.
   */
  getTimeRangeFromBucketIndex(index: number): NumberRange | null {
    if (!this.drawParams) return null;

    const leftFraction = index / this.drawParams.numBuckets;
    const rightFraction = (index + 1) / this.drawParams.numBuckets;

    const leftValue = this.rangeMapService.mapFractionToValueLinear(
      leftFraction,
      this.selectedYears,
      -1
    );
    const rightValue = this.rangeMapService.mapFractionToValueLinear(
      rightFraction,
      this.selectedYears,
      -1
    );

    return { min: leftValue, max: rightValue };
  }

  /**
   * Returns the time range corresponding to the bucket
   * which, when drawn on the canvas, contains the given
   * X pixel coordinate.
   */
  getTimeRangeFromPosition(position: PixelPair): NumberRange | null {
    if (!this.drawParams) return null;

    const bucketIndex = this.timelineService.getBucketIndexFromPosition(
      position,
      this.drawParams
    );
    if (bucketIndex === null) return null;

    return this.getTimeRangeFromBucketIndex(bucketIndex);
  }
}
