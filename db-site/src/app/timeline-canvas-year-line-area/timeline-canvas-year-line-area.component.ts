import { Component, Input, OnChanges } from '@angular/core';
import { NumberRange } from '../number-range.model';
import { PixelCoordinate } from '../pixel-coordinate.model';
import { TimelineCanvasPainterService } from '../timeline-canvas-painter.service';

@Component({
  selector: 'dbw-timeline-canvas-year-line-area',
  templateUrl: './timeline-canvas-year-line-area.component.html',
  styleUrls: ['./timeline-canvas-year-line-area.component.css'],
})
export class TimelineCanvasYearLineAreaComponent implements OnChanges {
  @Input() selectedYears!: NumberRange;
  @Input() numBuckets!: number;
  @Input() mousePosition!: PixelCoordinate | null;
  @Input() lastInsideMousePosition!: PixelCoordinate | null;

  mouseYears: NumberRange | null = null;

  constructor(private painterService: TimelineCanvasPainterService) {}

  ngOnChanges(): void {
    if (this.lastInsideMousePosition) {
      const newMouseYears = this.getTimeRangeFromPixel(
        this.lastInsideMousePosition.x
      );
      if (newMouseYears) this.mouseYears = newMouseYears;
    }
  }

  /**
   * Returns the time range which the bucket index corresponds to.
   */
  getTimeRangeFromBucketIndex(index: number): NumberRange | null {
    // If buckets have not been filled.
    if (this.numBuckets === 0) return null;

    const rangeSize = this.selectedYears.max + 1 - this.selectedYears.min;

    const start =
      this.selectedYears.min +
      Math.floor((index / this.numBuckets) * rangeSize);

    const end = Math.min(
      this.selectedYears.min +
        Math.floor(((index + 1) / this.numBuckets) * rangeSize),
      this.selectedYears.max
    );

    return { min: start, max: end };
  }

  /**
   * Returns the time range corresponding to the bucket
   * which, when drawn on the canvas, contains the given
   * X pixel coordinate.
   */
  getTimeRangeFromPixel(pixelX: number): NumberRange | null {
    const bucketIndex = this.painterService.getBucketIndexFromPixel(pixelX);
    if (bucketIndex === null) return null;
    return this.getTimeRangeFromBucketIndex(bucketIndex);
  }
}
