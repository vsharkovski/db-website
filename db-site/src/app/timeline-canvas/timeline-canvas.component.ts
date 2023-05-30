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
  distinctUntilChanged,
  throttleTime,
} from 'rxjs';

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

  maxTotalSelectable = 10000;
  numSelected = 0;
  buckets: Person[][] = [];

  canvasBoundingBox!: DOMRect;
  pointSize = 4;
  pointMargin = 2;
  pointSizePlusMargin = 6;
  yMiddle = 0;
  numBuckets = 10;

  // selectData$ = new Subject<NumberRange>();
  // drawCanvas$ = new Subject<void>();

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
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYears']) {
      // const range = changes['selectedYears'].currentValue;
      this.initializeCanvas$.next();
    }
  }

  ngOnInit(): void {
    // Sort people by notability index descending, in order to
    // speed up updates on selection change.
    this.data.sort((a, b) => b.notabilityIndex! - a.notabilityIndex!);

    // this.selectData$
    //   .pipe(
    //     debounceTime(100),
    //     distinctUntilChanged((a, b) => a.min == b.min && a.max == b.max)
    //   )
    //   .subscribe((range) => {
    //     this.selectData(range);
    //     this.drawCanvas$.next();
    //   });

    // this.drawCanvas$.pipe(debounceTime(100)).subscribe(() => this.drawCanvas());

    this.initializeCanvas$.pipe(debounceTime(100)).subscribe(() => {
      this.resizeCanvas();
      this.selectData(this.selectedYears);
      this.drawCanvas();
    });
  }

  ngAfterViewInit(): void {
    // Draw canvas initially.
    // this.drawCanvas$.next();
    this.initializeCanvas$.next();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // this.drawCanvas$.next();
    this.initializeCanvas$.next();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    console.log(event.offsetX, event.offsetY);
    this.getPointFromCoordinates(event.offsetX, event.offsetY);
  }

  resizeCanvas(): void {
    // Resize canvas to fit available space.
    const canvasElement = this.canvasRef.nativeElement;
    this.canvasBoundingBox = canvasElement.getBoundingClientRect();

    canvasElement.height = this.canvasBoundingBox.height;
    canvasElement.width = this.canvasBoundingBox.width;
  }

  /*
  Sort valid data into buckets.
  Uses canvas size and number of persons in a range to calculate:
  - How many buckets there should be
  - The size of the points when drawing the canvas later.
  */
  selectData(range: NumberRange) {
    // Returns whether the person is in the range.
    const isValid = (person: Person) =>
      range.min <= person.birth! && person.birth! <= range.max;

    let numPointsLeftToSelect = 0;
    for (const person of this.data) {
      if (isValid(person)) {
        numPointsLeftToSelect++;
        this.numSelected++;
        if (numPointsLeftToSelect >= this.maxTotalSelectable) break;
      }
    }

    // Used later in drawing.
    this.pointSize = 4;
    this.pointMargin = Math.round(this.pointSize / 2);
    this.pointSizePlusMargin = this.pointSize + this.pointMargin;

    // Used later in drawing and identifying mouse hovering over some point.
    this.yMiddle = Math.round(this.canvasBoundingBox!.height / 2);

    this.numBuckets = Math.floor(
      this.canvasBoundingBox.width / (this.pointSize + this.pointMargin)
    );
    this.numBuckets = Math.max(this.numBuckets, 1);

    console.log(
      `pointSize=${this.pointSize} pointMargin=${this.pointMargin} numBuckets=${this.numBuckets} toSelect=${numPointsLeftToSelect} range=[${range.min},${range.max}]`
    );

    // Initialize empty buckets.
    this.buckets = [];
    for (let i = 0; i < this.numBuckets; i++) {
      this.buckets.push([]);
    }

    if (numPointsLeftToSelect > 0 && this.numBuckets > 0) {
      const buckets = this.buckets;

      // Range size. The range is inclusive at both ends. [min, max].
      const rangeSize = range.max - range.min + 1;
      // Scale factor. Used in the following lambda to map a year in
      // the range [range.min, range.max] to [0, numBuckets-1].
      const scaleFactor = (this.numBuckets - 1) / rangeSize;
      const rangeMinMinusOne = range.min - 1;

      const getBucketFromYear = (year: number): Person[] =>
        buckets[Math.round((year - rangeMinMinusOne) * scaleFactor)];

      for (const person of this.data) {
        // Ensure person birth year is in the range.
        if (!isValid(person)) continue;

        // Add to bucket.
        const bucket = getBucketFromYear(person.birth!);
        bucket.push(person);

        numPointsLeftToSelect--;
        if (numPointsLeftToSelect == 0) {
          break;
        }
      }
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

    let yDistToMiddle = y - this.yMiddle;
    let pointIndex = null;

    console.log(`x=${x} y=${y} i=${bucketIndex} yDTM=${yDistToMiddle}`);

    if (yDistToMiddle >= 0) {
      // Below the middle line.
      const index = Math.floor(yDistToMiddle / this.pointSizePlusMargin);
      const slotStartY = index * this.pointSizePlusMargin;
      const yInSlot = yDistToMiddle - slotStartY;
      console.log(`ind=${index} sSY=${slotStartY} yIS=${yInSlot}`);
      if (this.pointMargin <= yInSlot && yInSlot < this.pointSizePlusMargin) {
        // Inside the point and not just inside the slot (not in a margin).
        pointIndex = 2 * index;
      }
    } else {
      // Above the middle line.
      const index = Math.floor(
        -(yDistToMiddle - this.pointMargin) / this.pointSizePlusMargin
      );
      const slotStartY = index * this.pointSizePlusMargin;
      const yInSlot = -(yDistToMiddle - this.pointMargin) - slotStartY;
      console.log(`ind=${index} sSY=${slotStartY} yIS=${yInSlot}`);
      if (this.pointMargin <= yInSlot && yInSlot < this.pointSizePlusMargin) {
        // Inside the point and not just inside the slot (not in a margin).
        pointIndex = 2 * index + 1;
      }
    }

    if (pointIndex == null) return null;

    // console.log(
    //   `j=${pointIndex} not=${this.buckets[bucketIndex][pointIndex].notabilityIndex}`
    // );

    console.log(`j=${pointIndex}`);
    return this.buckets[bucketIndex][pointIndex];
  }
}
