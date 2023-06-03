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

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() selectedYears!: NumberRange;
  @Input() data: TimelinePoint[] = [];
  @Input() filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };

  @ViewChild('canvas') canvasRef!: ElementRef;

  dataUpdated$ = new ReplaySubject<void>();
  initializeCanvas$ = new ReplaySubject<boolean>();

  readonly maxSelectable = 10000;

  // Data is re-processed when a new filter is applied (not years).
  dataProcessed: TimelinePoint[] = [];
  // Data selected to be split into buckets and later drawn.
  // Data is re-selected when selectedYears changes.
  dataSelected: TimelinePoint[] = [];

  // Time statistics.
  timeStatistics: TimelineTimeStatistics = {
    numPointsAtMoment: [],
    timeBoundaries: {
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MIN_SAFE_INTEGER,
    },
  };

  // The buckets into which the selected data is split.
  buckets: TimelinePoint[][] = [];

  // Drawing parameters.
  readonly minPointSizePixels = 4;
  readonly maxPointSizePixels = 36;
  readonly pointMarginFractionOfSize = 0.5;
  readonly pointColors = [
    'rgb(100, 100, 100)',
    'rgb(120, 120, 120)',
    'rgb(80, 80, 80)',
  ];
  canvasBoundingBox!: DOMRect;
  canvasMiddleYPixels = 0;
  pointSizePixels = 4;
  marginSizePixels = 2;
  pointMarginSizeCombined = 6;

  mousePositionPixels: { x: number; y: number } | null = null;
  lastValidMousePositionPixels: { x: number; y: number } | null = null;
  mouseYears: NumberRange | null = null;

  readonly hoverRadiusPixels = 16;
  readonly hoverPointerVisibileTimeAfterUpdateMs = 500;
  hoveredPoint: TimelinePoint | null = null;
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();

  hoveredPointPerson: Person | null = null;
  hoveredPointWikiPage: WikiApiPage | null = null;
  updateHoverApiData$ = new Subject<TimelinePoint>();

  constructor(
    private timelineService: TimelineService,
    private personService: PersonService,
    private wikiService: WikiService,
    private modalService: ModalService
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
        this.initializeCanvas$.next(true);
      }
    }

    if (changes['data'] || changes['filterOptions']) {
      this.dataUpdated$.next();
    }
  }

  ngOnInit(): void {
    this.dataUpdated$.pipe(debounceTime(100)).subscribe(() => {
      this.dataProcessed = this.timelineService.processData(
        this.data,
        this.filterOptions
      );
      this.timeStatistics = this.timelineService.calculateTimeStatistics(
        this.dataProcessed
      );
      this.initializeCanvas$.next(true);
    });

    this.initializeCanvas$
      .pipe(debounceTime(100))
      .subscribe((isForced) => this.initializeCanvas(isForced));

    /*
    Every time no hover point is selected when the mouse is moved, we request
    that the current hovered point is removed.
    Delay these requests for the hover pointer visibility time.
    Then, if the request was created after the last time the hovered point
    was updated to something not null, process it (unhover).
    */
    this.removeHoveredPoint$
      .pipe(
        delay(this.hoverPointerVisibileTimeAfterUpdateMs),
        filter((time) => time > this.hoveredPointLastTimeNotNullMs)
      )
      .subscribe((_) => {
        this.hoveredPoint = null;
        this.hoveredPointPerson = null;
        this.hoveredPointWikiPage = null;
      });

    this.updateHoverApiData$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(
          (point) => point.wikidataCode == this.hoveredPoint?.wikidataCode
        ),
        switchMap((point) =>
          this.personService.getPersonByWikidataCode(point.wikidataCode)
        ),
        filter(
          (person) =>
            person !== null &&
            person.wikidataCode === this.hoveredPoint?.wikidataCode
        ),
        switchMap((person) =>
          forkJoin([
            of(person),
            this.wikiService.getDataFromEnglishWiki(person!, 300),
          ])
        )
      )
      .subscribe(([person, wikiPage]) => {
        if (!this.hoveredPoint) return;
        const code = this.hoveredPoint.wikidataCode;
        if (code === person!.wikidataCode) {
          this.hoveredPointPerson = person;
        }
        if (code === wikiPage?.wikidataCode) {
          this.hoveredPointWikiPage = wikiPage;
        }
      });
  }

  ngAfterViewInit(): void {
    // Draw canvas initially.
    this.initializeCanvas$.next(false);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Re-draw canvas on window resize.
    this.initializeCanvas$.next(false);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.canvasBoundingBox) return;

    // Update most recent mouse position.
    const clamp = (x: number, min: number, max: number) =>
      Math.max(min, Math.min(max, x));

    this.mousePositionPixels = {
      x: clamp(
        Math.round(event.pageX - (this.canvasBoundingBox.x + window.scrollX)),
        0,
        this.canvasBoundingBox.width - 1
      ),
      y: clamp(
        Math.round(event.pageY - (this.canvasBoundingBox.y + window.scrollY)),
        0,
        this.canvasBoundingBox.height - 1
      ),
    };

    this.lastValidMousePositionPixels = this.mousePositionPixels;

    // Update mouse data.
    this.updateMouseData();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.mousePositionPixels = null;
    this.updateMouseData();
  }

  onPointerClick(): void {
    if (this.hoveredPointPerson) {
      this.modalService.openPersonDetailModal(this.hoveredPointPerson);
    }
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
   * (Re)initialize the canvas.
   * @param isForced Whether to force the initialization,.
   */
  initializeCanvas(isForced: boolean): void {
    const didResizeToNewSize = this.updateCanvasSize();

    // Re-select data for drawing, and draw canvas again,
    // but only if forced or the canvas was resized to a new size.
    if (isForced || didResizeToNewSize) {
      this.dataSelected = this.selectDataForDrawing(
        this.dataProcessed,
        this.selectedYears,
        this.maxSelectable
      );

      const maxPointsAtAnyMoment =
        this.timelineService.getMaxDataPointsAtAnyMoment(
          this.dataSelected,
          this.timeStatistics
        );
      this.updateDrawData(this.dataSelected.length, maxPointsAtAnyMoment);

      const numBuckets = Math.max(
        1,
        Math.floor(this.canvasBoundingBox.width / this.pointMarginSizeCombined)
      );
      const selectedYearsRangeSize =
        this.selectedYears.max + 1 - this.selectedYears.min;
      const mappingFn = (point: TimelinePoint): number =>
        (point.time - this.selectedYears.min) / selectedYearsRangeSize;
      this.buckets = this.timelineService.splitDataIntoBuckets(
        this.dataSelected,
        numBuckets,
        mappingFn,
        true
      );

      this.drawCanvas();

      this.resetMouseData();
      this.updateMouseData();
    }
  }

  /**
   * Resize canvas element (its height and width properties)
   * to fit its actual actual screen size.
   * Update canvasBoundingBox with new dimensions.
   * @returns Whether the canvas was resized (changed dimensions).
   */
  updateCanvasSize(): boolean {
    const canvasElement = this.canvasRef.nativeElement;
    this.canvasBoundingBox = canvasElement.getBoundingClientRect();

    const didResize =
      canvasElement.height != this.canvasBoundingBox.height ||
      canvasElement.width != this.canvasBoundingBox.width;

    canvasElement.height = this.canvasBoundingBox.height;
    canvasElement.width = this.canvasBoundingBox.width;

    return didResize;
  }

  /**
   * Update data used for drawing on the canvas and related tasks:
   * canvasMiddleYPixels, pointSize, marginSize.
   * @param numSelectedDataPoints The number of data points selected.
   * @param maxDataPointsAtAnyMoment The maximum number of data points
   * at some point in time.
   */
  updateDrawData(
    numSelectedDataPoints: number,
    maxDataPointsAtAnyMoment: number
  ): void {
    this.canvasMiddleYPixels = Math.round(this.canvasBoundingBox.height / 2);

    // Determine biggest point pixel size that would not make any bucket (column)
    // exceed the height of the canvas if drawn later.
    // We are assuming pointMargin will be a fraction of pointSize in order to
    // simplify calculations and approximate a good number with math.
    const pointSizeRaw = Math.sqrt(
      (this.canvasBoundingBox.height * this.canvasBoundingBox.width) /
        numSelectedDataPoints /
        maxDataPointsAtAnyMoment /
        (1 + this.pointMarginFractionOfSize) ** 2
    );

    this.pointSizePixels = Math.floor(pointSizeRaw);
    this.pointSizePixels = Math.max(
      this.minPointSizePixels,
      this.pointSizePixels
    );
    this.pointSizePixels = Math.min(
      this.maxPointSizePixels,
      this.pointSizePixels
    );

    // Make the margin be a fraction of the size of the point.
    this.marginSizePixels = Math.floor(
      this.pointSizePixels * this.pointMarginFractionOfSize
    );
    this.pointMarginSizeCombined = this.pointSizePixels + this.marginSizePixels;
  }

  /**
   * Draw the points in the buckets onto the canvas.
   */
  drawCanvas(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d', {
      alpha: false,
    });

    // Draw white background.
    ctx.fillStyle = 'white';
    ctx.fillRect(
      0,
      0,
      this.canvasBoundingBox.width,
      this.canvasBoundingBox.height
    );

    // Draw all buckets.
    // Index 0 will be in the middle, 1 above 0, 2 below 0, 3 below 1, etc.
    const pointSize = this.pointSizePixels;
    const pointSizePlusMargin = this.pointMarginSizeCombined;
    const yMiddle = this.canvasMiddleYPixels;
    const pointColors = this.pointColors;
    let x = this.marginSizePixels;

    for (const bucket of this.buckets) {
      // Y coordinate of top point will be a point and margin size away
      // from the middle line.
      let yTop = yMiddle - pointSizePlusMargin;
      // Y coordinate of bottom point will be directly at the bottom line.
      let yBottom = yMiddle;

      // Alternately place points at bottom/top positions and move
      // down/up, starting with the bottom position.
      for (let pointIndex = 0; pointIndex < bucket.length; pointIndex++) {
        // Pick random color for this point.
        ctx.fillStyle =
          pointColors[Math.floor(Math.random() * pointColors.length)];

        if (pointIndex % 2 == 0) {
          ctx.fillRect(x, yBottom, pointSize, pointSize);
          yBottom += pointSizePlusMargin;
        } else {
          ctx.fillRect(x, yTop, pointSize, pointSize);
          yTop -= pointSizePlusMargin;
        }
      }

      x += pointSizePlusMargin;
    }
  }

  resetMouseData(): void {
    this.mousePositionPixels = null;
    this.lastValidMousePositionPixels = null;
    this.mouseYears = null;
    this.hoveredPoint = null;
    this.hoveredPointPerson = null;
    this.hoveredPointWikiPage = null;
  }

  /**
   * Update hover data from the most recent mouse position.
   */
  updateMouseData(): void {
    // If mouse is not on canvas, can't do anything.
    if (!this.lastValidMousePositionPixels) return;

    // Update year range where mouse is.
    const newMouseYears = this.getTimeRangeFromPixel(
      this.lastValidMousePositionPixels.x
    );
    if (newMouseYears) this.mouseYears = newMouseYears;

    // Update hovered point and related properties.
    const hovered = this.getBestPointAroundPixel(
      this.lastValidMousePositionPixels.x,
      this.lastValidMousePositionPixels.y
    );
    const time = new Date().getTime();

    if (hovered == null) {
      // Request to remove the hovered point.
      this.removeHoveredPoint$.next(time);
    } else {
      if (hovered != this.hoveredPoint) {
        this.hoveredPoint = hovered;
        this.hoveredPointPerson = null;
        this.hoveredPointWikiPage = null;
        this.updateHoverApiData$.next(hovered);
      }
      this.hoveredPointLastTimeNotNullMs = time;
    }
  }

  getApproxGridPositionFromPixel(
    pixelX: number,
    pixelY: number
  ): { row: number; col: number } | null {
    // Bucket index is column.
    // Row is counted ..., -2, -1, 0, 1, 2, ...
    // with 0 being first point below middle line.
    const bucketIndex = this.getBucketIndexFromPixel(pixelX);
    if (bucketIndex === null) return null;

    const yDistToMiddle = pixelY - this.canvasMiddleYPixels;
    const row =
      yDistToMiddle >= 0
        ? Math.floor(
            (yDistToMiddle + this.marginSizePixels) /
              this.pointMarginSizeCombined
          )
        : Math.floor(yDistToMiddle / this.pointMarginSizeCombined);

    return { col: bucketIndex, row: row };
  }

  getBestPointAroundPixel(
    pixelX: number,
    pixelY: number
  ): TimelinePoint | null {
    const center = this.getApproxGridPositionFromPixel(pixelX, pixelY);
    if (center === null) return null;

    const maxDist = Math.max(
      0,
      Math.ceil(this.hoverRadiusPixels / this.pointMarginSizeCombined) - 1
    );

    // Look at cells in diamond shape around center (square rotated 45 degrees).
    let bestPoint: TimelinePoint | null = null;

    for (let deltaCol = -maxDist; deltaCol <= maxDist; deltaCol++) {
      const col = center.col + deltaCol;
      if (col < 0 || col >= this.buckets.length) continue;

      const bucket = this.buckets[col];
      const maxRowDist = maxDist - Math.abs(deltaCol);

      for (let deltaRow = -maxRowDist; deltaRow <= maxRowDist; deltaRow++) {
        const row = center.row + deltaRow;
        const index = row >= 0 ? 2 * row : 2 * -row - 1;

        if (
          index >= 0 &&
          index < bucket.length &&
          (bestPoint == null ||
            bestPoint!.notabilityIndex! < bucket[index].notabilityIndex!)
        ) {
          bestPoint = bucket[index];
        }
      }
    }

    return bestPoint;
  }

  /**
   * Returns the index of the bucket which, when drawn on the canvas,
   * contains the given X pixel coordinate.
   */
  getBucketIndexFromPixel(pixelX: number): number | null {
    const bucketIndex = Math.floor(pixelX / this.pointMarginSizeCombined);
    if (bucketIndex < 0 || bucketIndex >= this.buckets.length) return null;
    return bucketIndex;
  }

  /**
   * Returns the time range which the bucket index corresponds to.
   */
  getTimeRangeFromBucketIndex(index: number): NumberRange | null {
    // If buckets have not been filled.
    if (this.buckets.length === 0) return null;

    const rangeSize = this.selectedYears.max + 1 - this.selectedYears.min;

    const start =
      this.selectedYears.min +
      Math.floor((index / this.buckets.length) * rangeSize);

    const end = Math.min(
      this.selectedYears.min +
        Math.floor(((index + 1) / this.buckets.length) * rangeSize),
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
    const bucketIndex = this.getBucketIndexFromPixel(pixelX);
    if (bucketIndex === null) return null;
    return this.getTimeRangeFromBucketIndex(bucketIndex);
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
