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
import { ReplaySubject, debounceTime } from 'rxjs';

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() selectedYears!: NumberRange;

  @ViewChild('canvas') canvasRef!: ElementRef;

  data: Person[] = [];
  numDataPointsInYear: number[] = [];
  minYear = Number.MAX_SAFE_INTEGER;
  maxYear = Number.MIN_SAFE_INTEGER;

  readonly maxTotalSelectable = 10000;
  readonly minPointSize = 4;
  readonly maxPointSize = 36;
  readonly pointMarginFractionOfSize = 0.5;

  numSelected = 0;
  buckets: Person[][] = [];

  canvasBoundingBox!: DOMRect;
  pointSize = 4;
  pointMargin = 2;
  pointSizePlusMargin = 6;
  yMiddle = 0;
  numBuckets = 10;

  initializeCanvas$ = new ReplaySubject<void>();

  constructor() {
    for (let i = 0; i < 100000; i++) {
      const b = Math.round(gaussianRandom(1600, 100));
      const ni = Math.round(30 + Math.random() * 10);
      this.data.push({
        id: i,
        wikidataCode: i,
        birth: b,
        death: b,
        name: `${i}`,
        genderId: 0,
        level1MainOccId: 0,
        level3MainOccId: 0,
        citizenship1BId: 0,
        citizenship2BId: 0,
        notabilityIndex: ni,
      });
      this.minYear = Math.min(this.minYear, b);
      this.maxYear = Math.max(this.maxYear, b);
    }

    for (let i = 0; i < this.maxYear - this.minYear + 1; i++) {
      this.numDataPointsInYear[i] = 0;
    }
    for (const person of this.data) {
      this.numDataPointsInYear[person.birth! - this.minYear]++;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYears']) {
      this.initializeCanvas$.next();
    }
  }

  ngOnInit(): void {
    // Sort people by notability index descending, in order to
    // speed up updates on selection change.
    this.data.sort((a, b) => b.notabilityIndex! - a.notabilityIndex!);

    this.initializeCanvas$.pipe(debounceTime(100)).subscribe(() => {
      this.resizeCanvas();
      this.selectData(this.selectedYears);
      this.drawCanvas();
    });
  }

  ngAfterViewInit(): void {
    // Draw canvas initially.
    this.initializeCanvas$.next();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.initializeCanvas$.next();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const hovered = this.getPointFromCoordinates(event.offsetX, event.offsetY);
    if (hovered != null) {
      console.log(
        `hovered birth=${hovered.birth} ni=${hovered.notabilityIndex}`
      );
    }
  }

  resizeCanvas(): void {
    // Resize canvas to fit available space.
    const canvasElement = this.canvasRef.nativeElement;
    this.canvasBoundingBox = canvasElement.getBoundingClientRect();

    canvasElement.height = this.canvasBoundingBox.height;
    canvasElement.width = this.canvasBoundingBox.width;

    // Used later in drawing and identifying mouse hovering over some point.
    this.yMiddle = Math.round(this.canvasBoundingBox.height / 2);
  }

  /*
  Sort valid data into buckets.
  Uses canvas size and number of persons in a range to calculate:
  - The size of the points in pixels, for drawing later.
  - How many buckets there should be.
  */
  selectData(range: NumberRange) {
    // Lambda that returns whether the person is in the range.
    const isValid = (person: Person) =>
      range.min <= person.birth! && person.birth! <= range.max;

    // Determine how many people will be placed in buckets, up to the maximum provided.
    // Also determine the maximum number of points in a year in the range.
    this.numSelected = 0;
    let maxPointsInYear = 0;

    for (const person of this.data) {
      if (isValid(person)) {
        this.numSelected++;
        maxPointsInYear = Math.max(
          maxPointsInYear,
          this.numDataPointsInYear[person.birth! - this.minYear]
        );

        if (this.numSelected >= this.maxTotalSelectable) break;
      }
    }

    // Assume the buckets are [0, range.max-range.min], i.e. a bucket for each year.
    // Determine biggest point size that would not make any bucket (column) exceed
    // the height of the campus if drawn later.
    // We are assuming pointMargin will be a fraction of pointSize in order to
    // simplify calculations and do everything with math instead of binary searching.
    this.pointSize = Math.floor(
      this.canvasBoundingBox.height /
        ((1 + this.pointMarginFractionOfSize) * maxPointsInYear)
    );
    this.pointSize = Math.max(this.minPointSize, this.pointSize);
    this.pointSize = Math.min(this.maxPointSize, this.pointSize);

    this.pointMargin = Math.floor(this.pointSize / 2);
    this.pointSizePlusMargin = this.pointSize + this.pointMargin;

    this.numBuckets = Math.floor(
      this.canvasBoundingBox.width / this.pointSizePlusMargin
    );
    this.numBuckets = Math.max(this.numBuckets, 1);

    console.log(
      `maxPointsInYear=${maxPointsInYear} pointSizeRaw=${
        this.canvasBoundingBox.height / (1.5 * maxPointsInYear)
      } pointSize=${this.pointSize} rows=${
        this.canvasBoundingBox.height / this.pointSizePlusMargin
      } pointMargin=${this.pointMargin} numBuckets=${
        this.numBuckets
      } toSelect=${this.numSelected} range=[${range.min},${range.max}]`
    );

    // Initialize empty buckets.
    this.buckets = [];
    for (let i = 0; i < this.numBuckets; i++) {
      this.buckets.push([]);
    }

    if (this.numSelected == 0) return;

    // Place points into buckets.
    // Range size. The range is inclusive at both ends. [min, max].
    const rangeSize = range.max + 1 - range.min;
    // Scale factor. Used in the following lambda to *linearly*
    // map a year in the range [range.min, range.max] to [0, numBuckets-1].
    const scaleFactor = this.numBuckets / rangeSize;

    let numPointsRemaining = this.numSelected;

    for (const person of this.data) {
      // Ensure person birth year is in the range.
      if (!isValid(person)) continue;

      const index = Math.floor((person.birth! - range.min) * scaleFactor);
      this.buckets[index].push(person);

      // Stop if enough were placed.
      numPointsRemaining--;
      if (numPointsRemaining == 0) {
        break;
      }
    }

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
    for (let bucketIndex = 0; bucketIndex < this.numBuckets; bucketIndex++) {
      // Find ending index of the group. The group will be [start, end).
      // (start is included, end is excluded)
      let start = bucketIndex;
      let end = start + 1;
      while (end < this.numBuckets && this.buckets[end].length == 0) {
        end++;
      }

      // For each point in this group (all of which are currently in the
      // bucket at the start), move it to its new position.
      const groupSize = end - start;
      const group = this.buckets[start];
      this.buckets[start] = [];

      for (const person of group) {
        const index = start + Math.floor(Math.random() * (end - start));
        this.buckets[index].push(person);
      }

      // Next loop iteration, bucketIndex will be end, i.e. start of new group.
      bucketIndex = end - 1;
    }
  }

  drawCanvas(): void {
    // Draw all buckets.
    const canvasElement = this.canvasRef.nativeElement;

    const ctx = canvasElement.getContext('2d', {
      alpha: false,
    });

    ctx.fillStyle = 'white';
    ctx.fillRect(
      0,
      0,
      this.canvasBoundingBox.width,
      this.canvasBoundingBox.height
    );

    ctx.fillStyle = 'rgb(100, 100, 100)';

    const pointSize = this.pointSize;
    const pointSizePlusMargin = this.pointSizePlusMargin;
    const yMiddle = this.yMiddle;
    let x = this.pointMargin;

    for (let bucketIndex = 0; bucketIndex < this.numBuckets; bucketIndex++) {
      const bucket = this.buckets[bucketIndex];
      let yTop = yMiddle - pointSizePlusMargin;
      let yBottom = yMiddle;

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

  // Get point located at these pixel coordinates.
  // Coordinates should be relative to the canvas.
  getPointFromCoordinates(x: number, y: number): Person | null {
    if (this.numSelected == 0) return null;

    const bucketIndex = Math.floor(x / this.pointSizePlusMargin);
    if (bucketIndex < 0 || bucketIndex >= this.numBuckets) return null;

    const slotStartX = bucketIndex * this.pointSizePlusMargin;
    const xInSlot = x - slotStartX;

    if (xInSlot < this.pointMargin || this.pointSizePlusMargin <= xInSlot) {
      // Might be inside the 'slot' containing both the margin and point,
      // but not inside the point itself. I.e. may be in the margin.
      return null;
    }

    const yDistToMiddle = y - this.yMiddle;
    let pointIndex = null;

    // console.log(`x=${x} y=${y} i=${bucketIndex} yDTM=${yDistToMiddle}`);

    if (yDistToMiddle >= 0) {
      // Below the middle line.
      const index = Math.floor(
        (yDistToMiddle + this.pointMargin) / this.pointSizePlusMargin
      );
      const slotStartY = index * this.pointSizePlusMargin;
      const yInSlot = yDistToMiddle + this.pointMargin - slotStartY;
      // console.log(`ind=${index} sSY=${slotStartY} yIS=${yInSlot}`);
      if (this.pointMargin <= yInSlot && yInSlot < this.pointSizePlusMargin) {
        // Inside the point and not just inside the slot (not in a margin).
        pointIndex = 2 * index;
      }
    } else {
      // Above the middle line.
      const index = Math.floor(-yDistToMiddle / this.pointSizePlusMargin);
      const slotStartY = index * this.pointSizePlusMargin;
      const yInSlot = -yDistToMiddle - slotStartY;
      // console.log(`ind=${index} sSY=${slotStartY} yIS=${yInSlot}`);
      if (this.pointMargin <= yInSlot && yInSlot < this.pointSizePlusMargin) {
        // Inside the point and not just inside the slot (not in a margin).
        pointIndex = 2 * index + 1;
      }
    }

    if (pointIndex == null || pointIndex >= this.buckets[bucketIndex].length)
      return null;

    // console.log(
    //   `j=${pointIndex} not=${this.buckets[bucketIndex][pointIndex].notabilityIndex}`
    // );
    console.log(`i=${bucketIndex} j=${pointIndex}`);
    return this.buckets[bucketIndex][pointIndex];
  }
}
