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

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent
  implements OnInit, OnChanges, AfterViewInit
{
  readonly hoverPointerVisibileTimeAfterUpdateMs = 500;

  @Input() selectedYears!: NumberRange;
  @Input() data: TimelinePoint[] = [];

  @ViewChild('canvas') canvasRef!: ElementRef;

  initializeCanvas$ = new ReplaySubject<boolean>();

  readonly maxPlaceable = 10000;
  numPointsAtTime: number[] = [];
  minTime = Number.MAX_SAFE_INTEGER;
  maxTime = Number.MIN_SAFE_INTEGER;

  buckets: TimelinePoint[][] = [];

  // Data for drawing. Point size is also used to determine number of buckets.
  readonly minPointSizePixels = 4;
  readonly maxPointSizePixels = 36;
  readonly pointMarginFractionOfSize = 0.5;
  canvasBoundingBox!: DOMRect;
  canvasMiddleYPixels = 0;
  pointSizePixels = 4;
  marginSizePixels = 2;
  pointMarginSizeCombined = 6;

  readonly hoverRadiusPixels = 16;
  hoverPointerPositionPixels: { x: number; y: number } = { x: 0, y: 0 };
  hoveredPoint: TimelinePoint | null = null;
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();

  hoveredPointPerson: Person | null = null;
  hoveredPointWikiPage: WikiApiPage | null = null;
  updateHoveredApiData$ = new Subject<TimelinePoint>();

  constructor(
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
        // (Re)initialize canvas.
        this.initializeCanvas$.next(true);
      }
    }

    if (changes['data']) {
      this.sortDataAndUpdateTimeData();

      // (Re)initialize canvas.
      this.initializeCanvas$.next(true);
    }
  }

  ngOnInit(): void {
    this.initializeCanvas$
      .pipe(debounceTime(100))
      .subscribe((isForced) => this.initializeCanvas(isForced));

    /*
    Every time no hover point is selected when the mouse is moved, we request
    that the current hovered point is removed (see onMouseMove).
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

    this.updateHoveredApiData$
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
        if (`Q${code}` === wikiPage?.pageprops?.wikibase_item) {
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

    this.hoverPointerPositionPixels = {
      x: Math.round(event.pageX - (this.canvasBoundingBox.x + window.scrollX)),
      y: Math.round(event.pageY - (this.canvasBoundingBox.y + window.scrollY)),
    };
    const hovered = this.getBestPointAroundPixel(
      this.hoverPointerPositionPixels.x,
      this.hoverPointerPositionPixels.y
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
        this.updateHoveredApiData$.next(hovered);
      }
      this.hoveredPointLastTimeNotNullMs = time;
    }
  }

  onPointerClick(): void {
    if (this.hoveredPointPerson) {
      this.modalService.openPersonDetailModal(this.hoveredPointPerson);
    }
  }

  /**
   * Sort data and update time data.
   */
  sortDataAndUpdateTimeData(): void {
    // Sort data by notability index descending, in order to
    // be able to select the most notable points faster.
    this.data.sort((a, b) => b.notabilityIndex! - a.notabilityIndex!);

    // Update time data.
    const times = this.data.map((it) => it.time);
    this.minTime = Math.min(...times);
    this.maxTime = Math.max(...times);

    this.numPointsAtTime = [];
    for (let i = 0; i < this.maxTime - this.minTime + 1; i++) {
      this.numPointsAtTime.push(0);
    }

    for (const point of this.data) {
      this.numPointsAtTime[point.time - this.minTime]++;
    }
  }

  /**
   * (Re)initialize the canvas.
   * @param isForced Whether to force the initialization,.
   */
  initializeCanvas(isForced: boolean): void {
    const didResize = this.updateCanvasSize();

    // Re-select data and draw canvas again only if the canvas was
    // actually resized, or new (different) range was provided.
    if (isForced || didResize) {
      this.updateDrawData(this.selectedYears);
      this.fillBuckets(this.selectedYears);
      this.normalizeBuckets();
      this.drawCanvas();
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
   */
  updateDrawData(range: NumberRange): void {
    this.canvasMiddleYPixels = Math.round(this.canvasBoundingBox.height / 2);

    let numValid = 0;
    let maxPointsAtMoment = 0; // Maximum points at one moment in the time dimension.

    for (const point of this.data) {
      if (range.min <= point.time && point.time <= range.max) {
        numValid++;
        maxPointsAtMoment = Math.max(
          maxPointsAtMoment,
          this.numPointsAtTime[point.time - this.minTime]
        );

        if (numValid >= this.maxPlaceable) break;
      }
    }

    // Determine biggest point pixel size that would not make any bucket (column)
    // exceed the height of the canvas if drawn later.
    // We are assuming pointMargin will be a fraction of pointSize in order to
    // simplify calculations and approximate a good number with math.
    const pointSizeRaw = Math.sqrt(
      (this.canvasBoundingBox.height * this.canvasBoundingBox.width) /
        numValid /
        maxPointsAtMoment /
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
   * Fill the buckets with valid points.
   * @param range The time range, endpoints inclusive, in which a data point's time
   * would be valid
   */
  fillBuckets(range: NumberRange): void {
    const numBuckets = Math.max(
      1,
      Math.floor(this.canvasBoundingBox.width / this.pointMarginSizeCombined)
    );

    // Initialize empty buckets.
    this.buckets = [];
    for (let i = 0; i < numBuckets; i++) {
      this.buckets.push([]);
    }

    // Place points into buckets.
    // Range size. The range is inclusive at both ends. [min, max].
    const rangeSize = range.max + 1 - range.min;
    // Scale factor. Used to *linearly* map a year in the range
    // [range.min, range.max] to [0, numBuckets-1].
    const scaleFactor = numBuckets / rangeSize;

    let numPlaced = 0;

    for (const point of this.data) {
      // Ensure point time is in the range.
      if (range.max < point.time || point.time < range.min) continue;

      // Place into bucket.
      const index = Math.floor((point.time - range.min) * scaleFactor);
      this.buckets[index].push(point);

      // Stop if enough were placed.
      numPlaced++;
      if (numPlaced == this.maxPlaceable) break;
    }
  }

  /**
   * 'Spread out' full buckets into neighboring empty buckets to give things
   * a more normalized look.
   */
  normalizeBuckets(): void {
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
    for (
      let bucketIndex = 0;
      bucketIndex < this.buckets.length;
      bucketIndex++
    ) {
      // Find ending index of the group. The group will be [start, end).
      // (start is included, end is excluded)
      let start = bucketIndex;
      let end = start + 1;
      while (end < this.buckets.length && this.buckets[end].length == 0) {
        end++;
      }

      // For each point in this group (all of which are currently in the
      // bucket at the start), move it to its new position.
      const groupSize = end - start;
      const group = this.buckets[start];
      this.buckets[start] = [];

      for (const point of group) {
        const index = start + Math.floor(Math.random() * groupSize);
        this.buckets[index].push(point);
      }

      // Next loop iteration, bucketIndex will be end, i.e. start of new group.
      bucketIndex = end - 1;
    }
  }

  /**
   * Draw all points onto the canvas.
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
    ctx.fillStyle = 'rgb(100, 100, 100)';

    const pointSize = this.pointSizePixels;
    const pointSizePlusMargin = this.pointMarginSizeCombined;
    const yMiddle = this.canvasMiddleYPixels;
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

  /**
   * Get grid cell located at given pixel coordinates.
   * @returns The given point, or null if none.
   */
  getPointFromPixel(pixelX: number, pixelY: number): TimelinePoint | null {
    const bucketIndex = Math.floor(pixelX / this.pointMarginSizeCombined);
    if (bucketIndex < 0 || bucketIndex >= this.buckets.length) return null;

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

  getApproxGridPositionFromPixel(
    pixelX: number,
    pixelY: number
  ): { row: number; col: number } {
    // Bucket index is column.
    // Row is counted ..., -2, -1, 0, 1, 2, ...
    // with 0 being first point below middle line.
    const bucketIndex = Math.floor(pixelX / this.pointMarginSizeCombined);

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
}
