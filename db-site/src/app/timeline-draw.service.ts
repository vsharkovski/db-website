import { Injectable } from '@angular/core';
import { PixelPair } from './pixel-pair.model';
import { TimelineDrawParams } from './timeline-draw-params.model';
import { NumberRange } from './number-range.model';
import { GridPosition } from './grid-position.model';

@Injectable({
  providedIn: 'root',
})
export class TimelineDrawService {
  readonly pointSizeBoundary: NumberRange = { min: 5, max: 44 };
  readonly marginFractionOfPointSize = 0.25;

  /**
   * @returns Drawing parameters for the provided parameters.
   */
  getDrawParams(
    drawAreaSize: PixelPair,
    numDataPointsSelected: number,
    maxDataPointsSelectedAtAnyMoment: number
  ): TimelineDrawParams {
    // Determine biggest point pixel size that would not make any bucket (column)
    // exceed the height of the canvas if drawn later.
    // We are assuming pointMargin will be a fraction of pointSize in order to
    // simplify calculations and approximate a good number with math.
    const numSelected = Math.max(1, numDataPointsSelected);
    const maxAtAny = Math.max(1, maxDataPointsSelectedAtAnyMoment);

    const pointSizeDecimal = Math.sqrt(
      (drawAreaSize.x * drawAreaSize.y) /
        numSelected /
        maxAtAny ** (1 / 4) /
        (1 + this.marginFractionOfPointSize) ** 2
    );
    const pointSizeUnrestricted = Math.floor(pointSizeDecimal);
    const pointSize = Math.max(
      this.pointSizeBoundary.min,
      Math.min(this.pointSizeBoundary.max, pointSizeUnrestricted)
    );

    // Make the margin be a fraction of the size of the point.
    const marginSize = Math.floor(pointSize * this.marginFractionOfPointSize);

    return {
      drawAreaSize: drawAreaSize,
      drawAreaMiddlePosition: {
        x: Math.round(drawAreaSize.x / 2),
        y: Math.round(drawAreaSize.y / 2),
      },
      pointSize: pointSize,
      marginSize: marginSize,
      numBuckets: Math.max(
        1,
        Math.floor(drawAreaSize.x / (pointSize + marginSize))
      ),
    };
  }

  /**
   * Returns the index of the bucket which, when drawn on the canvas,
   * might contain the given X pixel coordinate.
   */
  getBucketIndexFromPosition(
    position: PixelPair,
    drawParams: TimelineDrawParams
  ): number | null {
    const bucketIndex = Math.floor(
      position.x / (drawParams.pointSize + drawParams.marginSize)
    );
    if (bucketIndex < 0 || bucketIndex >= drawParams.numBuckets) return null;
    return bucketIndex;
  }

  getApproxGridPositionFromPixelPosition(
    position: PixelPair,
    drawParams: TimelineDrawParams
  ): GridPosition | null {
    // Bucket index is column.
    // Row is counted ..., -2, -1, 0, 1, 2, ...
    // with 0 being first point below middle line.
    const bucketIndex = this.getBucketIndexFromPosition(position, drawParams);
    if (bucketIndex === null) return null;

    const yDistToMiddle = position.y - drawParams.drawAreaMiddlePosition.y;
    const pointMarginSizeCombined =
      drawParams.pointSize + drawParams.marginSize;

    const row =
      yDistToMiddle >= 0
        ? Math.floor(
            (yDistToMiddle + drawParams.marginSize) / pointMarginSizeCombined
          )
        : Math.floor(yDistToMiddle / pointMarginSizeCombined);

    return { row: row, col: bucketIndex };
  }

  getPixelPositionFromGridPosition(
    position: GridPosition,
    drawParams: TimelineDrawParams
  ): PixelPair {
    // Row and column considered in the same way as in getApproxGridPositionFromPixelPosition.
    const pointMarginSizeCombined =
      drawParams.pointSize + drawParams.marginSize;
    return {
      x: drawParams.marginSize + position.col * pointMarginSizeCombined,
      y:
        drawParams.drawAreaMiddlePosition.y +
        position.row * pointMarginSizeCombined,
    };
  }
}
