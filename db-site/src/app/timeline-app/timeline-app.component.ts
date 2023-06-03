import { Component, OnInit, ViewChild } from '@angular/core';
import { RangeSelectorComponent } from '../range-selector/range-selector.component';
import { NumberRange } from '../number-range.model';
import { TimelineService } from '../timeline.service';
import { TimelinePoint } from '../timeline-point.model';
import { TimelineOptions } from '../timeline-options.model';
import { PersonParametersService } from '../person-parameters.service';

@Component({
  selector: 'dbw-timeline-app',
  templateUrl: './timeline-app.component.html',
  styleUrls: ['./timeline-app.component.css'],
})
export class TimelineAppComponent implements OnInit {
  selectedYearsBoundary: NumberRange = { min: -3500, max: 2020 };
  selectedYears: NumberRange = { min: -600, max: 2000 };
  timelineData: TimelinePoint[] = [];
  filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };
  loadedData = false;

  @ViewChild(RangeSelectorComponent) rangeSelector?: RangeSelectorComponent;

  constructor(
    private timelineService: TimelineService,
    personParametersService: PersonParametersService
  ) {
    this.selectedYearsBoundary = {
      min: personParametersService.LIFE_YEAR_MIN,
      max: personParametersService.LIFE_YEAR_MAX,
    };
  }

  ngOnInit(): void {
    this.timelineService.getTimelineData().subscribe((data) => {
      this.timelineData = data;
      this.loadedData = true;
    });
  }

  onWheel(event: WheelEvent): void {
    if (this.rangeSelector) {
      const amount = 0.5 * (event.deltaX + event.deltaY + event.deltaZ);
      this.rangeSelector.doZoom(amount);

      // Prevent default scrolling behavior to keep the screen in place.
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onYearSelectionChanged(selection: NumberRange): void {
    this.selectedYears = selection;
  }

  onOptionsChanged(options: TimelineOptions): void {
    this.filterOptions = options;
  }

  onExactYearChanged(year: number | null): void {
    if (year !== null) {
      this.selectedYears = { min: year, max: year };
    }
  }
}
