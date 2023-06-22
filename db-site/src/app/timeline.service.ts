import { Injectable } from '@angular/core';
import { TimelinePoint } from './timeline-point.model';
import { TimelineTimeStatistics } from './timeline-statistics.model';
import { TimelineOptions } from './timeline-options.model';
import { TimelineDrawParams } from './timeline-draw-params.model';
import { NumberRange } from './number-range.model';
import { PixelPair } from './pixel-pair.model';
import { GridPosition } from './grid-position.model';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  readonly pointSizeBoundary: NumberRange = { min: 5, max: 44 };
  readonly marginFractionOfPointSize = 0.25;

  /**
   * Filter the data according to the filtering rules. Then sort the data.
   * @param data The data to process.
   * @param filterOptions The filtering rules. Null property means no restriction.
   * @returns The processed data
   */
  processData(
    data: TimelinePoint[],
    filterOptions: TimelineOptions
  ): TimelinePoint[] {
    let result = data;

    // Filter.
    if (filterOptions.citizenshipId) {
      result = result.filter(
        (it) => it.citizenship1BId === filterOptions.citizenshipId
      );
    }
    if (filterOptions.occupationLevel1Id) {
      result = result.filter(
        (it) => it.level1MainOccId === filterOptions.occupationLevel1Id
      );
    }
    if (filterOptions.genderId) {
      result = result.filter((it) => it.genderId === filterOptions.genderId);
    }

    // Sort by notability index descending, in order to speed up point selection.
    result.sort((a, b) => b.notabilityIndex - a.notabilityIndex);

    return result;
  }

  /**
   * Calculate time statistics for the data, i.e. the number of
   * data points at each time moment.
   * @param data The data.
   * @returns Two things:
   * - *numPointsAtTime*, array of length max-min+1, i.e.
   * index 0 will contain the number of points at time min,
   * index 1 -- min+1, index 2 -- min+2, ..., index (max-min) -- max.
   * - @code timeBoundary, range of the minimum and maximum possible
   * time (inclusive) which any data point has.
   */
  getTimeStatistics(data: TimelinePoint[]): TimelineTimeStatistics {
    const times = data.map((it) => it.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const numPointsAtMoment = [];
    for (let i = 0; i < maxTime - minTime + 1; i++) {
      numPointsAtMoment.push(0);
    }

    for (const point of data) {
      numPointsAtMoment[point.time - minTime]++;
    }

    return {
      numPointsAtMoment: numPointsAtMoment,
      timeBoundaries: { min: minTime, max: maxTime },
    };
  }

  /**
   * Return the maximum number of data points at any moment in time, using
   * the precalculated time statistics.
   * @param data The data to look at.
   * @param timeStats Precalculated time statistics.
   */
  getMaxDataPointsAtAnyMoment(
    data: TimelinePoint[],
    timeStatistics: TimelineTimeStatistics
  ): number {
    let result = 0;
    const minTime = timeStatistics.timeBoundaries.min;
    for (const point of data) {
      result = Math.max(
        result,
        timeStatistics.numPointsAtMoment[point.time - minTime]
      );
    }
    return result;
  }

  /**
   * Split data into buckets.
   * @param data The data to split.
   * @param numBuckets The number of buckets to split into.
   * @param pointMappingFn Function that takes a point and returns its
   * position within the range [0, 1).
   * @param shouldNormalize Whether to randomly normalize the buckets, i.e.
   * 'spread out' full buckets into neighboring empty buckets to give things
   * a more normalized look.
   */
  splitDataIntoBuckets(
    data: TimelinePoint[],
    numBuckets: number,
    pointMappingFn: (point: TimelinePoint) => number,
    shouldNormalize: boolean
  ): TimelinePoint[][] {
    // Initialize empty buckets.
    const buckets: TimelinePoint[][] = [];
    for (let i = 0; i < numBuckets; i++) {
      buckets.push([]);
    }

    for (const point of data) {
      // Place into bucket. Map the point time position to [0, numBuckets),
      // then round down to get [0, numBuckets-1].
      const index = Math.floor(pointMappingFn(point) * numBuckets);
      buckets[index].push(point);
    }

    if (shouldNormalize) {
      this.normalizeBuckets(buckets);
    }

    return buckets;
  }

  /**
   * 'Spread out' full buckets into neighboring empty buckets to give things
   * a more normalized look. In-place operation.
   */
  normalizeBuckets(buckets: TimelinePoint[][]): void {
    /*
    Due to the linear mapping, there are probably gaps of successive empty buckets.
    For example, by looking at the sizes of the buckets:
    2 0 0 0 5 0 0 4 0 0 0 2 0 0
    Due to the Math.floor in the linear map, the pattern looks like this:
    2 0 0 0 | 5 0 0 | 4 0 0 0 | 2 0 0
    Now we try to fill those empty buckets in each 'group' with points
    from the bucket at the start of the group, so things look more
    evenly distributed. For example:
    0 1 0 1 | 2 1 1 | 1 1 0 2 | 1 1 0
    */
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
      // Find ending index of the group. The group will be [start, end).
      // (start is included, end is excluded)
      let start = bucketIndex;
      let end = start + 1;
      while (end < buckets.length && buckets[end].length == 0) {
        end++;
      }

      // For each point in this group (all of which are currently in the
      // bucket at the start), move it to its new position.
      const groupSize = end - start;
      const group = buckets[start];
      buckets[start] = [];

      for (const point of group) {
        const index = start + Math.floor(Math.random() * groupSize);
        buckets[index].push(point);
      }

      // Next loop iteration, bucketIndex will be end, i.e. start of new group.
      bucketIndex = end - 1;
    }
  }

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
