import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import { SearchCriterion } from './search-criterion.model';
import { SearchResponse } from './search-response.model';
import { SortState } from './sort-state.model';
import { SearchParameters } from './search-parameters.model';
import { PersonParametersService } from './person-parameters.service';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly termRegex: RegExp;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
    private personParametersService: PersonParametersService
  ) {
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

  getTermFromSearchParameters(params: SearchParameters): string {
    const notNullOrNaN = (x: number | null): boolean => x !== null && !isNaN(x);
    let term = '';

    if (params.name) {
      // When advanced mode is disabled, add wildcards at start and end.
      let operator = ':';
      if (params.name.includes('*') || params.name.includes('_')) {
        operator = '~';
      }
      term += `name${operator}${params.name},`;
    }
    if (notNullOrNaN(params.birthMin)) {
      term += `birth>=${this.personParametersService.clampLifeYear(
        params.birthMin!
      )},`;
    }
    if (notNullOrNaN(params.birthMax)) {
      term += `birth<=${this.personParametersService.clampLifeYear(
        params.birthMax!
      )},`;
    }
    if (notNullOrNaN(params.deathMin)) {
      term += `death>=${this.personParametersService.clampLifeYear(
        params.deathMin!
      )},`;
    }
    if (notNullOrNaN(params.deathMax)) {
      term += `death<=${this.personParametersService.clampLifeYear(
        params.deathMax!
      )},`;
    }
    if (params.citizenshipId) {
      term += `citizenship1BId:${params.citizenshipId},`;
    }
    if (params.occupationLevel1Id) {
      term += `level1MainOccId:${params.occupationLevel1Id},`;
    }
    if (params.occupationLevel3Id) {
      term += `level3MainOccId:${params.occupationLevel3Id},`;
    }
    if (params.genderId) {
      term += `genderId:${params.genderId},`;
    }
    if (notNullOrNaN(params.notabilityMin)) {
      term += `notabilityIndex>=${this.personParametersService.clampNotability(
        params.notabilityMin!
      )},`;
    }
    if (notNullOrNaN(params.notabilityMax)) {
      term += `notabilityIndex<=${this.personParametersService.clampNotability(
        params.notabilityMax!
      )},`;
    }
    if (notNullOrNaN(params.wikidataCode)) {
      term += `wikidataCode:${params.wikidataCode},`;
    }
    if (term.endsWith(',')) {
      term = term.substring(0, term.length - 1);
    }
    return term;
  }
}
