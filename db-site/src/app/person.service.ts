import { Injectable } from '@angular/core';
import { Person } from './person.model';
import { Observable, map } from 'rxjs';
import { SearchService } from './search.service';
import { SearchParameters } from './search-parameters.model';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  constructor(private searchService: SearchService) {}

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
}
