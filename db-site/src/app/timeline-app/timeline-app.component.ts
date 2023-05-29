import { Component, OnInit, ViewChild } from '@angular/core';
import { RangeSelectorComponent } from '../range-selector/range-selector.component';

@Component({
  selector: 'dbw-timeline-app',
  templateUrl: './timeline-app.component.html',
  styleUrls: ['./timeline-app.component.css'],
})
export class TimelineAppComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  @ViewChild(RangeSelectorComponent) rangeSelector?: RangeSelectorComponent;

  onWheel(event: WheelEvent): void {
    if (this.rangeSelector) {
      const amount = 0.5 * (event.deltaX + event.deltaY + event.deltaZ);
      this.rangeSelector.doZoom(amount);
    }
  }
}
