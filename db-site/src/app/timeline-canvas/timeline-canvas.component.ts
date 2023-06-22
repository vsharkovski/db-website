import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NumberRange } from '../number-range.model';
import {
  ReplaySubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
} from 'rxjs';
import { TimelinePoint } from '../timeline-point.model';
import { TimelineOptions } from '../timeline-options.model';
import { MouseTrackerDirective } from '../mouse-tracker.directive';
import { PixelPair } from '../pixel-pair.model';
import { TimelineService } from '../timeline.service';
import { TimelineDrawParams } from '../timeline-draw-params.model';
import { TimelineTimeStatistics } from '../timeline-statistics.model';

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
  hostDirectives: [MouseTrackerDirective],
})
export class TimelineCanvasComponent
  implements OnChanges, OnInit, AfterViewInit
{
  readonly maxSelectable = 10000;

  @Input() selectedYears!: NumberRange;
  @Input() data!: TimelinePoint[];
  @Input() filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };

  selectedYears$ = new ReplaySubject<NumberRange>();
  dataProcessed$ = new ReplaySubject<{
    dataProcessed: TimelinePoint[];
    timeStatistics: TimelineTimeStatistics;
  }>();
  domAreaUpdated$ = new ReplaySubject<void>();

  // Mouse position is tracked for the mouse area and year line area components.
  mousePosition!: PixelPair | null;
  lastInsideMousePosition!: PixelPair | null;

  // Data used for drawing the timeline.
  drawParams: TimelineDrawParams | null = null;

  // The buckets into which the selected data is split.
  buckets: TimelinePoint[][] = [];

  constructor(
    private timelineService: TimelineService,
    private mouseTracker: MouseTrackerDirective,
    private elementRef: ElementRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYears']) {
      this.selectedYears$.next(this.selectedYears);
    }
    if (changes['data'] || changes['filterOptions']) {
      const dataProcessed = this.timelineService.processData(
        this.data,
        this.filterOptions
      );
      const timeStatistics =
        this.timelineService.getTimeStatistics(dataProcessed);
      this.dataProcessed$.next({ dataProcessed, timeStatistics });
    }
  }

  ngOnInit(): void {
    // Track mouse position for child components.
    combineLatest([
      this.mouseTracker.current$,
      this.mouseTracker.lastInside$,
    ]).subscribe(([currentPosition, lastInsidePosition]) => {
      this.mousePosition = currentPosition;
      this.lastInsideMousePosition = lastInsidePosition;
    });

    const jsonCompare = (a: any, b: any): boolean =>
      JSON.stringify(a) === JSON.stringify(b);

    const dataSelected$ = combineLatest([
      this.dataProcessed$,
      this.selectedYears$.pipe(distinctUntilChanged(jsonCompare)),
    ]).pipe(
      debounceTime(100),
      map(([{ dataProcessed, timeStatistics }, selectedYears]) => {
        const dataSelected = this.selectDataForDrawing(
          dataProcessed,
          selectedYears,
          this.maxSelectable
        );
        const maxSelectedDataPointsAtAnyMoment =
          this.timelineService.getMaxDataPointsAtAnyMoment(
            dataSelected,
            timeStatistics
          );
        return { dataSelected, maxSelectedDataPointsAtAnyMoment };
      })
    );

    combineLatest([dataSelected$, this.domAreaUpdated$.pipe(debounceTime(200))])
      .pipe()
      .subscribe(([dataSelected, _]) => {
        const elementDOMRect =
          this.elementRef.nativeElement.getBoundingClientRect();
        const drawAreaSize: PixelPair = {
          x: elementDOMRect.width,
          y: elementDOMRect.height,
        };
        this.drawParams = this.timelineService.getDrawParams(
          drawAreaSize,
          dataSelected.dataSelected.length,
          dataSelected.maxSelectedDataPointsAtAnyMoment
        );
        this.buckets = this.splitDataIntoBuckets(
          dataSelected.dataSelected,
          this.drawParams.numBuckets
        );
      });
  }

  ngAfterViewInit(): void {
    this.domAreaUpdated$.next();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.domAreaUpdated$.next();
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

  /**
   * Split data into buckets.
   * @param data The data to split.
   * @param numBuckets The number of buckets to split into.
   */
  splitDataIntoBuckets(
    data: TimelinePoint[],
    numBuckets: number
  ): TimelinePoint[][] {
    const selectedYearsRangeSize =
      this.selectedYears.max + 1 - this.selectedYears.min;
    const mappingFn = (point: TimelinePoint): number =>
      (point.time - this.selectedYears.min) / selectedYearsRangeSize;

    return this.timelineService.splitDataIntoBuckets(
      data,
      numBuckets,
      mappingFn,
      true
    );
  }
}
