import { Injectable } from '@angular/core';
import { Person } from './person.model';
import { Observable, catchError, map } from 'rxjs';
import { SearchService } from './search.service';
import { SearchParameters } from './search-parameters.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  readonly maxNumPeopleByWikidataCodes = 100;

  constructor(
    private searchService: SearchService,
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  getPersonByWikidataCode(wikidataCode: number): Observable<Person | null> {
    const searchParams = {
      wikidataCode: wikidataCode,
    } as SearchParameters;
    const term = this.searchService.getTermFromSearchParameters(searchParams);

    return this.searchService
      .getSearchResults(term, 0, 'notabilityIndex', 'descending')
      .pipe(
        map((response) =>
          response.results.length > 0 ? response.results[0] : null
        )
      );
  }

  getPeopleByWikidataCodes(
    wikidataCodes: number[]
  ): Observable<Person[] | null> {
    return this.http
      .get<Person[]>('/api/person/wikidata_codes', {
        params: new HttpParams().append(
          'codes',
          wikidataCodes.slice(0, this.maxNumPeopleByWikidataCodes).join(',')
        ),
      })
      .pipe(
        catchError(
          this.errorService.handleError('getPeopleByWikidataCodes', [])
        )
      );
  }
}
