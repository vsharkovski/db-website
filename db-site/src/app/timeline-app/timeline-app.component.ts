import { Component, OnInit, ViewChild } from '@angular/core';
import { RangeSelectorComponent } from '../range-selector/range-selector.component';
import { NumberRange } from '../number-range.model';
import { TimelineService } from '../timeline.service';
import { TimelinePoint } from '../timeline-point.model';
import { TimelineOptions } from '../timeline-options.model';
import { PersonParametersService } from '../person-parameters.service';
import { TimelineLoadedDataType } from '../timeline-loaded-data.type';
import { ReplaySubject, delay, map, merge, of } from 'rxjs';
import { RangeMappingType } from '../range-mapping.type';

@Component({
  selector: 'dbw-timeline-app',
  templateUrl: './timeline-app.component.html',
  styleUrls: ['./timeline-app.component.css'],
})
export class TimelineAppComponent implements OnInit {
  readonly partialDataResultLimit = 5000;
  readonly partialDataYearsBoundary: NumberRange = { min: 1800, max: 1900 };
  readonly fullDataYearsBoundary: NumberRange = { min: -3500, max: 2020 };

  hasMousePointer = true;

  selectedYearsBoundary = { ...this.partialDataYearsBoundary };
  selectedYears: NumberRange = { ...this.partialDataYearsBoundary };
  rangeMappingType: RangeMappingType = 'linear';

  timelineData: TimelinePoint[] = [];

  filterOptions: TimelineOptions = {
    citizenshipId: null,
    occupationLevel1Id: null,
    genderId: null,
  };

  loadedDataType: TimelineLoadedDataType = 'none';
  loadingMessage$ = new ReplaySubject<string>();

  @ViewChild(RangeSelectorComponent) rangeSelector?: RangeSelectorComponent;

  constructor(
    private timelineService: TimelineService,
    personParametersService: PersonParametersService
  ) {
    // Check if there is a mouse pointer. One is needed for the app to work.
    if (window.matchMedia('(any-hover: none)').matches) {
      this.hasMousePointer = false;
    }

    this.fullDataYearsBoundary = {
      min: personParametersService.LIFE_YEAR_MIN,
      max: personParametersService.LIFE_YEAR_MAX,
    };
  }

  ngOnInit(): void {
    if (!this.hasMousePointer) return;

    // Load data.
    this.loadingMessage$.next('Loading...');

    const mapToType = (type: TimelineLoadedDataType) => {
      return (
        data: TimelinePoint[]
      ): [TimelinePoint[], TimelineLoadedDataType] => [data, type];
    };

    // Request for both full and partial data immediately.
    merge(
      this.timelineService.getFullTimelineData().pipe(map(mapToType('full'))),
      this.timelineService
        .getPartialTimelineData(
          this.partialDataResultLimit,
          this.partialDataYearsBoundary
        )
        .pipe(map(mapToType('partial')))
    ).subscribe(([data, type]) => {
      if (
        data.length > 0 &&
        (type == 'full' || (type == 'partial' && this.loadedDataType == 'none'))
      ) {
        // Got better data.
        this.timelineData = data;
        this.loadedDataType = type;

        if (type == 'partial') {
          // Update loading message.
          this.loadingMessage$.next(
            'Loaded 19th century. Loading full timeline...'
          );
        }
        if (type == 'full') {
          // Update boundary and mapping type.
          this.selectedYearsBoundary = this.fullDataYearsBoundary;
          this.rangeMappingType = 'log';

          // Update loading message.
          this.loadingMessage$.next('Loaded.');
          of(null)
            .pipe(delay(4000))
            .subscribe(() => this.loadingMessage$.next(''));
        }
      }
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
