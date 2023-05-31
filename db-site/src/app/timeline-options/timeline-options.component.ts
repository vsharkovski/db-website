import { Component, Input, OnInit } from '@angular/core';
import { NumberRange } from '../number-range.model';

@Component({
  selector: 'dbw-timeline-options',
  templateUrl: './timeline-options.component.html',
  styleUrls: ['./timeline-options.component.css'],
})
export class TimelineOptionsComponent implements OnInit {
  @Input() selectedYears!: NumberRange;
  constructor() {}

  ngOnInit(): void {}
}
