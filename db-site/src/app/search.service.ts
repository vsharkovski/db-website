import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import { SearchCriterion } from './search-criterion.model';
import { SearchResponse } from './search-response.model';
import { SortState } from './sort-state.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  readonly termRegex: RegExp;

  constructor(private http: HttpClient, private errorService: ErrorService) {
    // Create the regular expression for terms.
    const searchOperators = [':', '!', '>=', '>', '<=', '<', '~'];
    const searchOperatorsJoinedOr = searchOperators.join('|');
    const forbiddenCharacters = `,${searchOperators.join('')}`;
    const regexpString = [
      `(\\w+?)`,
      `(${searchOperatorsJoinedOr})`,
      `([^${forbiddenCharacters}]+?)`,
      `,`,
    ].join('');
    this.termRegex = new RegExp(regexpString, 'g');
  }

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
            results: [],
            hasNextPage: false,
            hasPreviousPage: false,
            pageNumber: 0,
            totalPages: 0,
            totalResults: 0,
            resultsPerPage: 0,
            sort: {
              variable: 'notabilityIndex',
              direction: 'descending',
            } as SortState,
          })
        )
      );
  }

  getSearchCriteriaFromTerm(term: string): SearchCriterion[] {
    // Match regex groups in term and create a list of all matches.
    return [...`${term},`.matchAll(this.termRegex)].map((match) => ({
      key: match[1],
      operation: match[2],
      value: match[3],
    }));
  }
}
