import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Person } from '../person.model';
import { NumberRange } from '../number-range.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

interface DataPoint {
  person: Person;
}

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent implements OnInit, OnChanges {
  @Input() selectedYears!: NumberRange;

  data: Person[] = [];

  numBuckets = 50;
  maxTotalSelectable = 100;
  buckets: Person[][] = [];

  selectDataRequested = new Subject<NumberRange>();

  constructor() {
    for (let i = 0; i < 500; i++) {
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
      this.selectData(range);
    }
  }

  ngOnInit(): void {
    // Sort people by notability index descending, in order to
    // speed up updates on selection change.
    this.data.sort((a, b) => b.notabilityIndex! - a.notabilityIndex!);

    this.selectDataRequested
      .pipe(
        debounceTime(200),
        distinctUntilChanged((a, b) => a.min == b.min && a.max == b.max)
      )
      .subscribe((range) => this.selectData(range));
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
}
