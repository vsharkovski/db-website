import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Person } from '../person.model';
import { NumberRange } from '../number-range.model';

@Component({
  selector: 'dbw-timeline-canvas',
  templateUrl: './timeline-canvas.component.html',
  styleUrls: ['./timeline-canvas.component.css'],
})
export class TimelineCanvasComponent implements OnInit, OnChanges {
  @Input() selectedYears!: NumberRange;

  data: Person[] = [];
  dataFiltered: Person[] = [];

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
      this.dataFiltered = this.data.filter(
        (it) => range.min <= it.birth! && it.birth! <= range.max
      );
    }
  }

  ngOnInit(): void {}
}
