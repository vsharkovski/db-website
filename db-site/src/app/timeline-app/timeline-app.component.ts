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
  hasMousePointer = true;
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
    // Check if there is a mouse pointer. One is needed for the app to work.
    if (window.matchMedia('(any-hover: none)').matches) {
      this.hasMousePointer = false;
    }

    this.selectedYearsBoundary = {
      min: personParametersService.LIFE_YEAR_MIN,
      max: personParametersService.LIFE_YEAR_MAX,
    };
  }

  ngOnInit(): void {
    if (!this.hasMousePointer) return;

    this.timelineService.getTimelineData().subscribe((data) => {
      this.timelineData = data;
      this.loadedData = true;
    });
  }

  onWheel(event: WheelEvent): void {
    if (this.rangeSelector) {
      this.rangeSelector.doZoomDefault(
        Math.sign(event.deltaX + event.deltaY + event.deltaZ)
      );

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
    if (
      year !== null &&
      this.selectedYearsBoundary.min <= year &&
      year <= this.selectedYearsBoundary.max
    ) {
      this.selectedYears = { min: year, max: year };
    }
  }
}
