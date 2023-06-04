import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Person } from '../person.model';
import { NumberRange } from '../number-range.model';
import {
  ReplaySubject,
  Subject,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { TimelinePoint } from '../timeline-point.model';
import { PersonService } from '../person.service';
import { WikiService } from '../wiki.service';
import { WikiApiPage } from '../wiki-api-page.model';
import { ModalService } from '../modal.service';
import { TimelineOptions } from '../timeline-options.model';
import { TimelineService } from '../timeline.service';
import { TimelineTimeStatistics } from '../timeline-statistics.model';
import { TimelineCanvasYearLineAreaComponent } from '../timeline-canvas-year-line-area/timeline-canvas-year-line-area.component';

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent implements OnInit, OnChanges {
  @Input() selectedYears!: NumberRange;
  @Input() data: TimelinePoint[] = [];
  @Input() filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };

  dataUpdated$ = new ReplaySubject<void>();

  selectionChanged$ = new ReplaySubject<void>();
  selectionChangedToBeProcessed = false;

  // Data is re-processed when a new filter is applied (not years).
  dataProcessed: TimelinePoint[] = [];
  // Data selected to be split into buckets and later drawn.
  // Data is re-selected when selectedYears changes.
  readonly maxSelectable = 10000;
  dataSelected: TimelinePoint[] = [];
  maxSelectedDataPointsAtAnyMoment: number | null = null;

  // Time statistics.
  timeStatistics: TimelineTimeStatistics = {
    numPointsAtMoment: [],
    timeBoundaries: {
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MIN_SAFE_INTEGER,
    },
  };

  // The number of buckets is received from a child component and
  // then used to split the selected data.
  numBuckets: number | null = null;

  // The buckets into which the selected data is split.
  buckets: TimelinePoint[][] = [];

  constructor(private timelineService: TimelineService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYears']) {
      const change = changes['selectedYears'];
      const range = change.currentValue;
      const prevRange = change.previousValue;
      if (
        change.isFirstChange() ||
        range.min != prevRange.min ||
        range.max != prevRange.max
      ) {
        this.selectionChanged$.next();
        this.selectionChangedToBeProcessed = true;
      }
    }

    if (changes['data'] || changes['filterOptions']) {
      this.dataUpdated$.next();
    }
  }

  ngOnInit(): void {
    this.dataUpdated$.subscribe(() => {
      this.dataProcessed = this.timelineService.processData(
        this.data,
        this.filterOptions
      );
      this.timeStatistics = this.timelineService.calculateTimeStatistics(
        this.dataProcessed
      );
      this.selectionChanged$.next();
      this.selectionChangedToBeProcessed = true;
    });

    this.selectionChanged$.pipe(debounceTime(100)).subscribe(() => {
      this.dataSelected = this.selectDataForDrawing(
        this.dataProcessed,
        this.selectedYears,
        this.maxSelectable
      );
      this.maxSelectedDataPointsAtAnyMoment =
        this.timelineService.getMaxDataPointsAtAnyMoment(
          this.dataSelected,
          this.timeStatistics
        );
      this.selectionChangedToBeProcessed = false;
    });
  }

  /**
   * Select valid data points. The array is processed left-to-right,
   * so data points earlier in the array have a higher priority.
   * @param data The data to select from.
   * @param validRange The time range in which data points are valid.
   * @param maxSelectable The maximum number to select.
   * @returns The selected data.
   */
  selectDataForDrawing(
    data: TimelinePoint[],
    validRange: NumberRange,
    maxSelectable: number
  ): TimelinePoint[] {
    if (maxSelectable == 0) return [];
    const result = [];
    for (const point of data) {
      if (point.time < validRange.min || validRange.max < point.time) continue;
      result.push(point);
      if (result.length === maxSelectable) break;
    }
    return result;
  }

  onNumBucketsReceived(numBuckets: number): void {
    if (!this.selectionChangedToBeProcessed) {
      // We didn't select different data in the time it took for us to
      // get the number of buckets. Therefore, we can split the data.
      this.numBuckets = numBuckets;
      this.splitDataIntoBuckets();
    }
  }

  splitDataIntoBuckets(): void {
    if (!this.numBuckets) return;

    const selectedYearsRangeSize =
      this.selectedYears.max + 1 - this.selectedYears.min;
    const mappingFn = (point: TimelinePoint): number =>
      (point.time - this.selectedYears.min) / selectedYearsRangeSize;

    this.buckets = this.timelineService.splitDataIntoBuckets(
      this.dataSelected,
      this.numBuckets,
      mappingFn,
      true
    );
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
