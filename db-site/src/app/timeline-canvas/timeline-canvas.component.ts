import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NumberRange } from '../number-range.model';
import { ReplaySubject, combineLatest, debounceTime } from 'rxjs';
import { TimelinePoint } from '../timeline-point.model';
import { TimelineOptions } from '../timeline-options.model';
import { TimelineTimeStatistics } from '../timeline-statistics.model';
import { MouseTrackerDirective } from '../mouse-tracker.directive';
import { PixelCoordinate } from '../pixel-coordinate.model';
import { TimelineService } from '../timeline.service';

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
  hostDirectives: [MouseTrackerDirective],
})
export class TimelineCanvasComponent implements OnInit, OnChanges {
  @Input() selectedYears!: NumberRange;
  @Input() data: TimelinePoint[] = [];
  @Input() filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };

  // Mouse position is tracked for the mouse area and year line area components.
  mousePosition!: PixelCoordinate | null;
  lastInsideMousePosition!: PixelCoordinate | null;

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

  constructor(
    private timelineService: TimelineService,
    private mouseTracker: MouseTrackerDirective
  ) {}

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
    combineLatest([
      this.mouseTracker.current$,
      this.mouseTracker.lastInside$,
    ]).subscribe(([currentPosition, lastInsidePosition]) => {
      this.mousePosition = currentPosition;
      this.lastInsideMousePosition = lastInsidePosition;
    });

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
}
