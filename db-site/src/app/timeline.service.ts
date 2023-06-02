import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, of } from 'rxjs';
import { TimelinePoint } from './timeline-point.model';
import { TimelineResponse } from './timeline-response.model';

const MAX_NUM_KEYS = 4;
const TIMELINE_NUM_KEYS_KEY = 'timeline-keys';
const TIMELINE_PART_KEY_BASE = 'timeline-data';

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  timelineData: TimelinePoint[] = [];
  timelineDataFromApi$ = new Subject<TimelinePoint[]>();
  requestedDataFromApi = false;

  constructor(private http: HttpClient, private errorService: ErrorService) {
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

  getTimelineData(): Observable<TimelinePoint[]> {
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
            this.errorService.handleError('getTimelineData', { results: [] })
          )
        )
        .subscribe((response) => {
          // this.cacheResponse(response);

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

  /**
   * @returns Whether caching was successful.
   */
  private cacheResponse(response: TimelineResponse): boolean {
    // Remove all cached keys from possible previous attempts.
    for (let keyNumber = 0; keyNumber < MAX_NUM_KEYS; keyNumber++) {
      const key = this.getKeyFromKeyNumber(keyNumber);
      window.localStorage.removeItem(key);
    }

    const responseString = JSON.stringify(response);
    const numKeys = Math.min(responseString.length, MAX_NUM_KEYS);
    const partLength = Math.ceil(responseString.length / numKeys);

    let numKeysUsed = 0;
    let startPos = 0;

    // Split response into parts and cache each part.
    for (let keyNumber = 0; keyNumber < numKeys; keyNumber++) {
      if (startPos >= responseString.length) {
        break;
      }

      const length = Math.min(partLength, responseString.length - startPos);
      const part = responseString.substring(startPos, length);
      const key = this.getKeyFromKeyNumber(keyNumber);

      try {
        window.localStorage.setItem(key, part);

        numKeysUsed++;
        startPos += length;
      } catch (e) {
        console.log(
          `Could not cache response part ${keyNumber} in local storage. Full length: ${responseString.length}. Part length: ${length}`,
          e
        );
        return false;
      }
    }

    // Cache number of keys used.
    window.localStorage.removeItem(TIMELINE_NUM_KEYS_KEY);
    window.localStorage.setItem(TIMELINE_NUM_KEYS_KEY, numKeysUsed.toString());

    return true;
  }

  /**
   * @returns Whether it was loaded.
   */
  private loadDataFromCache(): boolean {
    return false;

    const numKeysString = window.localStorage.getItem(TIMELINE_NUM_KEYS_KEY);
    if (numKeysString === null) {
      console.log('Could not load number of keys from cache.');
      return false;
    }

    const numKeys = Number(numKeysString);
    const parts = [];

    for (let keyNumber = 0; keyNumber < numKeys; keyNumber++) {
      const key = this.getKeyFromKeyNumber(keyNumber);
      const part = window.localStorage.getItem(key);

      if (part === null) {
        console.log(
          `Could not find part ${keyNumber} of ${numKeys} from cache.`
        );
        return false;
      } else {
        parts.push(part);
      }
    }

    try {
      const fullResponse = JSON.parse(parts.join(''));
      const data = this.processResponse(fullResponse);

      this.timelineData = data;
      console.log('Loading from cache successful.');
      return true;
    } catch (e) {
      console.log('Loading from cache failed.', e);
      return false;
    }
  }

  private getKeyFromKeyNumber(keyNumber: number): string {
    return `${TIMELINE_PART_KEY_BASE}-${keyNumber}`;
  }
}
