import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import { SearchResponse } from './search-response.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getSearchResults(term: string, page: number): Observable<SearchResponse> {
    return this.http
      .get<SearchResponse>('api/search', {
        params: new HttpParams({
          fromObject: {
            page: page,
            term: term,
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
            sort: { variable: null, direction: null },
          })
        ),
        map((results) => {
          if (!results.sort) {
            results.sort = { variable: null, direction: null };
          }
          return results;
        })
      );
  }
}
