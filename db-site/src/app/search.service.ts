import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import { SearchResponse } from './search-response.model';
import { SortState } from './sort-state.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getSearchResults(
    term: string,
    page: number,
    sortVariable: SortState['variable'],
    sortDirection: SortState['direction']
  ): Observable<SearchResponse> {
    return this.http
      .get<SearchResponse>('api/search', {
        params: new HttpParams({
          fromObject: {
            page: page,
            term: term,
            sortVariable: sortVariable,
            sortDirection: sortDirection,
          },
        }),
      })
      .pipe(
        catchError(
          this.errorService.handleError('getSearchResults', {
            success: false,
            persons: [],
            hasNextPage: false,
            hasPreviousPage: false,
            pageNumber: 0,
            maxSliceSize: 0,
            sort: {
              variable: 'notabilityIndex',
              direction: 'descending',
            } as SortState,
          })
        )
      );
  }
}
