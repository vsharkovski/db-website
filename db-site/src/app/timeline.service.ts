import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  concat,
  concatMap,
  filter,
  map,
  of,
  take,
  tap,
} from 'rxjs';
import { TimelinePoint } from './timeline-point.model';
import { TimelineResponse } from './timeline-response.model';

const TIMELINE_KEY = 'timeline-data';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  timelineData: TimelinePoint[] = [];
  timelineDataFromApi$ = new Subject<TimelinePoint[]>();
  requestedDataFromApi = false;

  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getTimelineData(): Observable<TimelinePoint[]> {
    if (this.timelineData.length > 0) {
      return of(this.timelineData);
    }

    const cachedResponse = window.localStorage.getItem(TIMELINE_KEY);
    if (cachedResponse) {
      const data = this.processResponse(JSON.parse(cachedResponse));
      this.timelineData = data;
      return of(data);
    }

    if (!this.requestedDataFromApi) {
      this.http
        .get<TimelineResponse>('api/timeline')
        .pipe(
          catchError(
            this.errorService.handleError('getTimelineData', { results: [] })
          )
        )
        .subscribe((response) => {
          // this.saveResponse(response);

          const data = this.processResponse(response);
          this.timelineData = data;

          this.timelineDataFromApi$.next(data);
        });

      this.requestedDataFromApi = true;
    }

    return this.timelineDataFromApi$.asObservable();
  }

  private processResponse(data: TimelineResponse): TimelinePoint[] {
    return data.results.map((it) => ({
      wikidataCode: it.wC,
      time: it.t,
      notabilityIndex: it.n,
      genderId: it.g,
      level1MainOccId: it.l1o,
      citizenship1BId: it.c1b,
    }));
  }

  private saveResponse(response: TimelineResponse): void {
    window.localStorage.removeItem(TIMELINE_KEY);
    window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(response));
  }
}
