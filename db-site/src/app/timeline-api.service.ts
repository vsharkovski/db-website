import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, catchError, map, of } from 'rxjs';
import { TimelinePoint } from './timeline-point.model';
import { TimelineResponse } from './timeline-response.model';
import { StorageItem } from './storage-item.model';
import { NumberRange } from './number-range.model';

const TIMELINE_RESPONSE_KEY = 'timeline-data';
const STORAGE_LIFETIME_MS = 1000 * 60 * 60 * 24; // One day.

@Injectable({
  providedIn: 'root',
})
export class TimelineApiService {
  timelineData: TimelinePoint[] = [];
  timelineDataFromApi$ = new Subject<TimelinePoint[]>();
  requestedDataFromApi = false;

  constructor(private http: HttpClient, private errorService: ErrorService) {
    // Standard Normal variate using Box-Muller transform.
    // function gaussianRandom(mean = 0, stdev = 1) {
    //   const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    //   const v = Math.random();
    //   const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    //   // Transform to the desired mean and standard deviation:
    //   return z * stdev + mean;
    // }
    //
    // for (let i = 0; i < 100000; i++) {
    //   const b = Math.round(gaussianRandom(1600, 100));
    //   const ni = Math.round(30 + Math.random() * 10);
    //   this.timelineData.push({
    //     wikidataCode: i,
    //     time: b,
    //     notabilityIndex: ni,
    //     genderId: 0,
    //     level1MainOccId: 0,
    //     citizenship1BId: 0,
    //   });
    // }
  }

  getFullTimelineData(): Observable<TimelinePoint[]> {
    if (this.timelineData.length > 0) {
      return of(this.timelineData);
    }

    if (this.loadDataFromCache()) {
      return of(this.timelineData);
    }

    if (!this.requestedDataFromApi) {
      this.http
        .get<TimelineResponse>('api/timeline')
        .pipe(
          catchError(
            this.errorService.handleError('getFullTimelineData', {
              results: [],
            } as TimelineResponse)
          )
        )
        .subscribe((response) => {
          // Cache response if it was valid (assuming there will always be a
          // nonzero number of results).
          if (response.results.length > 0) {
            this.cacheResponse(response);
          }

          const data = this.processResponse(response);
          this.timelineData = data;

          this.timelineDataFromApi$.next(data);
        });

      this.requestedDataFromApi = true;
    }

    return this.timelineDataFromApi$.asObservable();
  }

  getPartialTimelineData(
    resultLimit: number,
    timeLimit: NumberRange
  ): Observable<TimelinePoint[]> {
    return this.http
      .get<TimelineResponse>('api/timeline', {
        params: new HttpParams()
          .append('limit', resultLimit)
          .append('minTime', timeLimit.min)
          .append('maxTime', timeLimit.max),
      })
      .pipe(
        catchError(
          this.errorService.handleError('getPartialTimelineData', {
            results: [],
          } as TimelineResponse)
        ),
        map((response) => this.processResponse(response))
      );
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

  /**
   * @returns Whether caching was successful.
   */
  private cacheResponse(response: TimelineResponse): boolean {
    const toStore = JSON.stringify({
      updatedMs: new Date().getTime(),
      value: response,
    } as StorageItem);

    window.localStorage.removeItem(TIMELINE_RESPONSE_KEY);

    try {
      window.localStorage.setItem(TIMELINE_RESPONSE_KEY, toStore);
    } catch (e) {
      // console.log(
      //   `Could not cache response in local storage. Length: ${toStore.length}.`,
      //   e
      // );
      return false;
    }

    return true;
  }

  /**
   * @returns Whether it was loaded.
   */
  private loadDataFromCache(): boolean {
    const storedString = window.localStorage.getItem(TIMELINE_RESPONSE_KEY);
    if (storedString === null) {
      // console.log('Nothing was cached.');
      return false;
    }

    let storageItem!: StorageItem;
    try {
      storageItem = JSON.parse(storedString);
    } catch (e) {
      // console.log('Parsing cached data failed.', e);
      return false;
    }

    const currentTimeMs = new Date().getTime();
    if (storageItem.updatedMs + STORAGE_LIFETIME_MS < currentTimeMs) {
      // console.log('Cached data was expired.');
      return false;
    }

    const data = this.processResponse(storageItem.value);
    this.timelineData = data;

    // console.log('Loading cached data successful.');
    return true;
  }
}
