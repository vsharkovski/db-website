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

  maxTotalSelectable = 3000;
  buckets: Person[][] = [];

  canvasBoundingBox?: DOMRect;
  pointSize = 4;
  pointMargin = 2;
  numBuckets = 10;

  // selectData$ = new Subject<NumberRange>();
  // drawCanvas$ = new Subject<void>();

  initializeCanvas$ = new ReplaySubject<void>();

  constructor() {
    for (let i = 0; i < 1000; i++) {
      const b = gaussianRandom(1600, 100);
      const ni = 30 + Math.random() * 10;
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

  resizeCanvas(): void {
    // Resize canvas to fit available space.
    const canvasElement = this.canvasRef.nativeElement;
    this.canvasBoundingBox = canvasElement.getBoundingClientRect();

    canvasElement.height = this.canvasBoundingBox!.height;
    canvasElement.width = this.canvasBoundingBox!.width;
  }

  /*
  Sort valid data into buckets.
  Uses canvas size to calculate:
  - How many buckets there should be
  - The size of the points when drawing the canvas later.
  */
  selectData(range: NumberRange) {
    const isValid = (person: Person) =>
      range.min <= person.birth! && person.birth! <= range.max;

    let numPointsLeftToSelect = 0;
    for (const person of this.data) {
      if (isValid(person)) {
        numPointsLeftToSelect++;
        if (numPointsLeftToSelect == this.maxTotalSelectable) break;
      }
    }

    this.pointSize = 4;
    this.pointMargin = Math.round(this.pointSize / 2);

    this.numBuckets = Math.floor(
      this.canvasBoundingBox!.width / (this.pointSize + this.pointMargin)
    );
    this.numBuckets = Math.max(this.numBuckets, 1);

    console.log(
      `pointSize=${this.pointSize} pointMargin=${this.pointMargin} numBuckets=${this.numBuckets}`
    );

    if (numPointsLeftToSelect > 0) {
      this.buckets = new Array(this.numBuckets).fill([]);
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
      this.canvasBoundingBox!.width,
      this.canvasBoundingBox!.height
    );

    ctx.fillStyle = 'black';

    const pointSize = this.pointSize;
    const pointSizePlusMargin = this.pointSize + this.pointMargin;

    const yMiddle = Math.round(
      this.canvasBoundingBox!.height / 2 - pointSize / 2
    );
    let x = this.pointMargin;

    for (let bucketIndex = 0; bucketIndex < this.numBuckets; bucketIndex++) {
      const bucket = this.buckets[bucketIndex];
      let yTop = yMiddle;
      let yBottom = yMiddle + pointSizePlusMargin;

      for (let pointIndex = 0; pointIndex < bucket.length; ++pointIndex) {
        if (pointIndex % 2 == 0) {
          ctx.fillRect(x, yTop, pointSize, pointSize);
          yTop -= pointSizePlusMargin;
        } else {
          ctx.fillRect(x, yBottom, pointSize, pointSize);
          yBottom += pointSizePlusMargin;
        }
      }

      x += pointSizePlusMargin;
    }
  }
}
