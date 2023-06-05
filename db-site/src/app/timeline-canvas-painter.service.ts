import { Injectable } from '@angular/core';
import { PixelCoordinate } from './pixel-coordinate.model';
import { GridPosition } from './grid-position.model';

@Injectable({
  providedIn: 'root',
})
export class TimelineCanvasPainterService {
  private _numBuckets = 1;
  private _canvasMiddleYPixels = 0;
  private _marginSizePixels = 2;
  private _pointMarginSizeCombined = 6;

  public set numBuckets(numBuckets: number) {
    this._numBuckets = numBuckets;
  }

  public set canvasMiddleYPixels(canvasMiddleYPixels: number) {
    this._canvasMiddleYPixels = canvasMiddleYPixels;
  }

  public set marginSizePixels(marginSizePixels: number) {
    this._marginSizePixels = marginSizePixels;
  }

  public set pointMarginSizeCombined(pointMarginSizeCombined: number) {
    this._pointMarginSizeCombined = pointMarginSizeCombined;
  }

  /**
   * Returns the index of the bucket which, when drawn on the canvas,
   * might contain the given X pixel coordinate.
   */
  getBucketIndexFromPixel(pixelX: number): number | null {
    const bucketIndex = Math.floor(pixelX / this._pointMarginSizeCombined);
    if (bucketIndex < 0 || bucketIndex >= this._numBuckets) return null;
    return bucketIndex;
  }

  getApproxGridPositionFromPixel(pixel: PixelCoordinate): GridPosition | null {
    // Bucket index is column.
    // Row is counted ..., -2, -1, 0, 1, 2, ...
    // with 0 being first point below middle line.
    const bucketIndex = this.getBucketIndexFromPixel(pixel.x);
    if (bucketIndex === null) return null;

    const yDistToMiddle = pixel.y - this._canvasMiddleYPixels;
    const row =
      yDistToMiddle >= 0
        ? Math.floor(
            (yDistToMiddle + this._marginSizePixels) /
              this._pointMarginSizeCombined
          )
        : Math.floor(yDistToMiddle / this._pointMarginSizeCombined);

    return { col: bucketIndex, row: row };
  }

  getPixelFromGridPosition(position: GridPosition): PixelCoordinate {
    // Row and column considered in the same way as in getApproxGridPositionFromPixel.
    return {
      x: this._marginSizePixels + position.col * this._pointMarginSizeCombined,
      y:
        this._canvasMiddleYPixels +
        position.row * this._pointMarginSizeCombined,
    };
  }

  getApproxGridDistanceFromPixelDistance(distancePixels: number): number {
    return Math.ceil(distancePixels / this._pointMarginSizeCombined);
  }

  /**
   * Get grid cell located at given pixel coordinates.
   * @returns The given point, or null if none.
   */
  /*
  getPointFromPixel(pixelX: number, pixelY: number): TimelinePoint | null {
    const bucketIndex = this.getBucketIndexFromPixel(pixelX);
    if (bucketIndex === null) return null;

    // A 'slot' is margin + point.
    const slotStartX = bucketIndex * this.pointMarginSizeCombined;
    // X position in the slot.
    const xInSlot = pixelX - slotStartX;

    if (
      xInSlot < this.marginSizePixels ||
      this.pointMarginSizeCombined <= xInSlot
    ) {
      // In the margin of the slot, but not the point.
      return null;
    }

    const yDistToMiddle = pixelY - this.canvasMiddleYPixels;
    let pointIndex = null;

    if (yDistToMiddle >= 0) {
      // Below the middle line.
      // Rows are counted 0, 1, 2, ... with 0 for the first point below the line.
      // Do similar logic as for the x dimension.
      // Because the first slot below the line doesn't have a margin (see drawCanvas),
      // we add it manually.
      const row = Math.floor(
        (yDistToMiddle + this.marginSizePixels) / this.pointMarginSizeCombined
      );
      const slotStartY = row * this.pointMarginSizeCombined;
      const yInSlot = yDistToMiddle + this.marginSizePixels - slotStartY;

      if (
        this.marginSizePixels <= yInSlot &&
        yInSlot < this.pointMarginSizeCombined
      ) {
        // Inside the point, not the margin.
        // See logic in drawCanvas for determining actual point index in the bucket
        // using the row.
        pointIndex = 2 * row;
      }
    } else {
      // Above the middle line.
      // Rows are counted 0, 1, 2, ... with 0 for the first point above the line.
      const row = Math.floor(-yDistToMiddle / this.pointMarginSizeCombined);
      const slotStartY = row * this.pointMarginSizeCombined;
      const yInSlot = -yDistToMiddle - slotStartY;

      if (
        this.marginSizePixels <= yInSlot &&
        yInSlot < this.pointMarginSizeCombined
      ) {
        // Inside the point, not the margin.
        // See logic in drawCanvas for determining actual point index in the bucket
        // using the row.
        pointIndex = 2 * row + 1;
      }
    }

    if (pointIndex === null || pointIndex >= this.buckets[bucketIndex].length)
      return null;

    return this.buckets[bucketIndex][pointIndex];
  }
  */
}
