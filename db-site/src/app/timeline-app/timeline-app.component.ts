import { Component, OnInit, ViewChild } from '@angular/core';
import { RangeSelectorComponent } from '../range-selector/range-selector.component';
import { NumberRange } from '../number-range.model';
import { TimelineService } from '../timeline.service';
import { TimelinePoint } from '../timeline-point.model';

@Component({
  selector: 'dbw-timeline-app',
  templateUrl: './timeline-app.component.html',
  styleUrls: ['./timeline-app.component.css'],
})
export class TimelineAppComponent implements OnInit {
  selectedYearsBoundary: NumberRange = { min: -3500, max: 2020 };
  selectedYears: NumberRange = { min: -600, max: 2000 };
  timelineData: TimelinePoint[] = [];

  @ViewChild(RangeSelectorComponent) rangeSelector?: RangeSelectorComponent;

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    this.timelineService
      .getTimelineData()
      .subscribe((data) => (this.timelineData = data));
  }

  onWheel(event: WheelEvent): void {
    if (this.rangeSelector) {
      const amount = 0.5 * (event.deltaX + event.deltaY + event.deltaZ);
      this.rangeSelector.doZoom(amount);
    }
  }

  onYearSelectionChanged(selection: NumberRange): void {
    this.selectedYears = selection;
  }
}
