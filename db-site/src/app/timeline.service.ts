import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, of } from 'rxjs';
import { TimelinePoint } from './timeline-point.model';
import { TimelineResponse } from './timeline-response.model';
import { TimelineOptions } from './timeline-options.model';
import { TimelineTimeStatistics } from './timeline-statistics.model';
import { StorageItem } from './storage-item.model';

const TIMELINE_RESPONSE_KEY = 'timeline-data';
const STORAGE_LIFETIME_MS = 1000 * 60 * 60 * 24; // One day.

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  timelineData: TimelinePoint[] = [];
  timelineDataFromApi$ = new Subject<TimelinePoint[]>();
  requestedDataFromApi = false;

  constructor(private http: HttpClient, private errorService: ErrorService) {
    // Standard Normal variate using Box-Muller transform.
    function gaussianRandom(mean = 0, stdev = 1) {
      const u = 1 - Math.random(); // Converting [0,1) to (0,1]
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      // Transform to the desired mean and standard deviation:
      return z * stdev + mean;
    }

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

  /**
   * Filter the data according to the filtering rules. Then sort the data.
   * @param data The data to process.
   * @param filterOptions The filtering rules. Null property means no restriction.
   * @returns The processed data
   */
  processData(
    data: TimelinePoint[],
    filterOptions: TimelineOptions
  ): TimelinePoint[] {
    let result = data;

    // Filter.
    if (filterOptions.citizenshipId) {
      result = result.filter(
        (it) => it.citizenship1BId === filterOptions.citizenshipId
      );
    }
    if (filterOptions.occupationLevel1Id) {
      result = result.filter(
        (it) => it.level1MainOccId === filterOptions.occupationLevel1Id
      );
    }
    if (filterOptions.genderId) {
      result = result.filter((it) => it.genderId === filterOptions.genderId);
    }

    // Sort by notability index descending, in order to speed up point selection.
    result.sort((a, b) => b.notabilityIndex - a.notabilityIndex);

    return result;
  }

  /**
   * Calculate time statistics for the data, i.e. the number of
   * data points at each time moment.
   * @param data The data.
   * @returns Two things:
   * - *numPointsAtTime*, array of length max-min+1, i.e.
   * index 0 will contain the number of points at time min,
   * index 1 -- min+1, index 2 -- min+2, ..., index (max-min) -- max.
   * - @code timeBoundary, range of the minimum and maximum possible
   * time (inclusive) which any data point has.
   */
  calculateTimeStatistics(data: TimelinePoint[]): TimelineTimeStatistics {
    const times = data.map((it) => it.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const numPointsAtMoment = [];
    for (let i = 0; i < maxTime - minTime + 1; i++) {
      numPointsAtMoment.push(0);
    }

    for (const point of data) {
      numPointsAtMoment[point.time - minTime]++;
    }

    return {
      numPointsAtMoment: numPointsAtMoment,
      timeBoundaries: { min: minTime, max: maxTime },
    };
  }

  /**
   * Return the maximum number of data points at any moment in time, using
   * the precalculated time statistics.
   * @param data The data to look at.
   * @param timeStats Precalculated time statistics.
   */
  getMaxDataPointsAtAnyMoment(
    data: TimelinePoint[],
    timeStatistics: TimelineTimeStatistics
  ): number {
    let result = 0;
    const minTime = timeStatistics.timeBoundaries.min;
    for (const point of data) {
      result = Math.max(
        result,
        timeStatistics.numPointsAtMoment[point.time - minTime]
      );
    }
    return result;
  }

  /**
   * Split data into buckets.
   * @param data The data to be split.
   * @param numBuckets The number of buckets to split into.
   * @param pointMappingFn Function that takes a point and returns its
   * position within the range [0, 1).
   * @param shouldNormalize Whether to randomly normalize the buckets, i.e.
   * 'spread out' full buckets into neighboring empty buckets to give things
   * a more normalized look.
   */
  splitDataIntoBuckets(
    data: TimelinePoint[],
    numBuckets: number,
    pointMappingFn: (point: TimelinePoint) => number,
    shouldNormalize: boolean
  ): TimelinePoint[][] {
    // Initialize empty buckets.
    const buckets: TimelinePoint[][] = [];
    for (let i = 0; i < numBuckets; i++) {
      buckets.push([]);
    }

    for (const point of data) {
      // Place into bucket. Map the point time position to [0, numBuckets),
      // then round down to get [0, numBuckets-1].
      const index = Math.floor(pointMappingFn(point) * numBuckets);
      buckets[index].push(point);
    }

    if (shouldNormalize) {
      this.normalizeBuckets(buckets);
    }

    return buckets;
  }

  /**
   * 'Spread out' full buckets into neighboring empty buckets to give things
   * a more normalized look. In-place operation.
   */
  normalizeBuckets(buckets: TimelinePoint[][]): void {
    /*
    Due to the linear mapping, there are probably gaps of successive empty buckets.
    For example, by looking at the sizes of the buckets:
    2 0 0 0 5 0 0 4 0 0 0 2 0 0
    Due to the Math.floor in the linear map, the pattern looks like this:
    2 0 0 0 | 5 0 0 | 4 0 0 0 | 2 0 0
    Now we try to fill those empty buckets in each 'group' with points
    from the bucket at the start of the group, so things look more
    evenly distributed. For example:
    0 1 0 1 | 2 1 1 | 1 1 0 2 | 1 1 0
    */
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
      // Find ending index of the group. The group will be [start, end).
      // (start is included, end is excluded)
      let start = bucketIndex;
      let end = start + 1;
      while (end < buckets.length && buckets[end].length == 0) {
        end++;
      }

      // For each point in this group (all of which are currently in the
      // bucket at the start), move it to its new position.
      const groupSize = end - start;
      const group = buckets[start];
      buckets[start] = [];

      for (const point of group) {
        const index = start + Math.floor(Math.random() * groupSize);
        buckets[index].push(point);
      }

      // Next loop iteration, bucketIndex will be end, i.e. start of new group.
      bucketIndex = end - 1;
    }
  }
}
