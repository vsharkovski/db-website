import { Component, OnInit } from '@angular/core';
import { NumberRange } from '../number-range.model';

@Component({
  selector: 'dbw-timeline-canvas-year-line-area',
  templateUrl: './timeline-canvas-year-line-area.component.html',
  styleUrls: ['./timeline-canvas-year-line-area.component.css'],
})
export class TimelineCanvasYearLineAreaComponent implements OnInit {
  mouseYears: NumberRange | null = null;
  constructor() {}

  ngOnInit(): void {}

  /**
   * Update hover data from the most recent mouse position.
   */
  // updateMouseData(): void {
  //   // If mouse is not on canvas, can't do anything.
  //   if (!this.lastValidMousePositionPixels) return;

  //   // Update year range where mouse is.
  //   const newMouseYears = this.getTimeRangeFromPixel(
  //     this.lastValidMousePositionPixels.x
  //   );
  //   if (newMouseYears) this.mouseYears = newMouseYears;
  // }

  // resetMouseData() {
  //   this.mousePositionPixels = null;
  //   this.lastValidMousePositionPixels = null;
  //   this.mouseYears = null;
  // }

  // /**
  //  * Returns the time range which the bucket index corresponds to.
  //  */
  // getTimeRangeFromBucketIndex(index: number): NumberRange | null {
  //   // If buckets have not been filled.
  //   if (this.buckets.length === 0) return null;

  //   const rangeSize = this.selectedYears.max + 1 - this.selectedYears.min;

  //   const start =
  //     this.selectedYears.min +
  //     Math.floor((index / this.buckets.length) * rangeSize);

  //   const end = Math.min(
  //     this.selectedYears.min +
  //       Math.floor(((index + 1) / this.buckets.length) * rangeSize),
  //     this.selectedYears.max
  //   );

  //   return { min: start, max: end };
  // }

  // /**
  //  * Returns the time range corresponding to the bucket
  //  * which, when drawn on the canvas, contains the given
  //  * X pixel coordinate.
  //  */
  // getTimeRangeFromPixel(pixelX: number): NumberRange | null {
  //   const bucketIndex = this.getBucketIndexFromPixel(pixelX);
  //   if (bucketIndex === null) return null;
  //   return this.getTimeRangeFromBucketIndex(bucketIndex);
  // }
}
