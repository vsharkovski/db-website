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
  Subject,
  debounceTime,
  distinctUntilChanged,
  throttleTime,
} from 'rxjs';

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

  numBuckets = 500;
  maxTotalSelectable = 4000;
  buckets: Person[][] = [];

  selectData$ = new Subject<NumberRange>();
  drawCanvas$ = new Subject<void>();

  constructor() {
    for (let i = 0; i < 10000; i++) {
      const b = Math.random() * 2000;
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
      const range = changes['selectedYears'].currentValue;
      this.selectData$.next(range);
    }
  }

  ngOnInit(): void {
    // Sort people by notability index descending, in order to
    // speed up updates on selection change.
    this.data.sort((a, b) => b.notabilityIndex! - a.notabilityIndex!);

    this.selectData$
      .pipe(
        debounceTime(100),
        distinctUntilChanged((a, b) => a.min == b.min && a.max == b.max)
      )
      .subscribe((range) => {
        this.selectData(range);
        this.drawCanvas$.next();
      });

    this.drawCanvas$.pipe(debounceTime(100)).subscribe(() => this.drawCanvas());
  }

  ngAfterViewInit(): void {
    // Draw canvas initially.
    this.drawCanvas$.next();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.drawCanvas$.next();
  }

  selectData(range: NumberRange) {
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

    let numSpacesLeft = this.maxTotalSelectable;
    if (numSpacesLeft == 0) return;

    for (const person of this.data) {
      // Ensure person birth year is in the range.
      if (person.birth! < range.min || person.birth! > range.max) continue;

      // Add to bucket.
      const bucket = getBucketFromYear(person.birth!);
      bucket.push(person);

      numSpacesLeft--;
      if (numSpacesLeft == 0) {
        break;
      }
    }
  }

  drawCanvas(): void {
    console.log('Drawing canvas');
    const canvasElement = this.canvasRef.nativeElement;

    // Resize canvas to fit available space.
    const boundingBox = canvasElement.getBoundingClientRect();
    canvasElement.height = boundingBox.height;
    canvasElement.width = boundingBox.width;

    // Draw all buckets.
    const ctx = canvasElement.getContext('2d', {
      alpha: false,
    });

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, boundingBox.width, boundingBox.height);

    ctx.fillStyle = 'black';

    const pointSize = 4;
    const margin = 2;
    const pointSizePlusMargin = pointSize + margin;

    const yMiddle = Math.round(boundingBox.height / 2 - pointSize / 2);
    let x = margin;

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
