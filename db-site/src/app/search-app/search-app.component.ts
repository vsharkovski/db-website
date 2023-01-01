import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { SearchQuery } from '../search-query.model';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';
import { SortState } from '../sort-state.model';

@Component({
  selector: 'dbw-search-app',
  templateUrl: './search-app.component.html',
  styleUrls: ['./search-app.component.css'],
})
export class SearchAppComponent implements OnInit {
  currentTab = 1;
  results?: SearchResponse;
  requestedQuery?: SearchQuery;
  latestQuery?: SearchQuery;

  searchQueryChanged = new Subject<SearchQuery>();
  searchOptionsSubmitted = new Subject<void>();
  pageOrSortChanged = new Subject<void>();

  hasAskedForResults: boolean = false;
  waitingForResults: boolean = false;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Pass initial params from route to search options.
    // Whenever the requestedQuery object changes, the search-options element
    // (which is bound to the object) will process the changes, and then
    // emit an event which triggers searchQueryChanged.
    const initParams = this.route.snapshot.queryParams;
    this.requestedQuery = {
      term: initParams['term'] ?? '',
      page: Number(initParams['page'] ?? 0),
      sort: null,
    };

    // Whenever the search query is changed, either from the search-options element
    // or from changing a page or sort state, update the route with the new query.
    this.searchQueryChanged.subscribe((query: SearchQuery) => {
      this.latestQuery = this.mergeQueries(query, this.latestQuery);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          term: this.latestQuery.term,
          page: this.latestQuery.page,
          sortVariable: this.latestQuery.sort?.variable ?? 'notabilityIndex',
          sortDirection: this.latestQuery.sort?.direction ?? 'descending',
        },
      });
    });

    const resultsReceived = new Subject<void>();

    // Whenever the route is updated or the search form is submitted,
    // filter unnecessary options using debounceTime, distinctUntilChanged,
    // and by making sure the search query has a 'term'.
    const readyToAskForResults = merge(
      this.searchOptionsSubmitted.pipe(
        map(() => this.route.snapshot.queryParams)
      ),
      this.route.queryParams
    ).pipe(
      debounceTime(1000),
      // Necessary to convert to string because otherwise the objects coming from
      // each source observable in routeChangedOrSubmitted would be considered different
      // although they represent the same thing.
      distinctUntilChanged((a, b) => JSON.stringify(a) == JSON.stringify(b)),
      filter((params) => params['term'])
    );

    // Ask the API for results.
    const results$ = readyToAskForResults.pipe(
      switchMap((params) =>
        this.searchService.getSearchResults(
          params['term'] ?? '',
          params['page'] ?? 0,
          params['sortVariable'] ?? 'notabiliyIndex',
          params['sortDirection'] ?? 'descending'
        )
      )
    );

    // Subscribe to the observable described above. Whenever results are received,
    // update this.results to trigger binding events, and emit from resultsReceived
    // to update the wait status for UI effects.
    results$.subscribe((results) => {
      this.results = results;
      resultsReceived.next();
    });

    /*
      Update the wait status in the following moments:
      - About to ask the API for results (set to true)
      - Just received results from the API (set to false)
      - User changed the page or sort state (set to true in order to disable appropriate UI)
    */
    merge(
      readyToAskForResults.pipe(map(() => true)),
      resultsReceived.pipe(map(() => false)),
      this.pageOrSortChanged.pipe(map(() => true))
    ).subscribe((newWaitStatus) => {
      console.log('Got wait status', newWaitStatus);
      this.waitingForResults = newWaitStatus;
      if (newWaitStatus) {
        this.hasAskedForResults = true;
      }
    });
  }

  onPageButtonClick(pageChange: number): void {
    // Whenever the page is changed and it is possible to move to the new page,
    // update the requestedQuery object which will trigger the mechanism
    // as described in ngOnInit.
    if (
      ((pageChange === -1 && this.results?.hasPreviousPage) ||
        (pageChange === 1 && this.results?.hasNextPage)) &&
      this.latestQuery &&
      this.latestQuery.page + pageChange >= 0
    ) {
      this.requestedQuery = {
        term: this.latestQuery.term,
        page: this.latestQuery.page + pageChange,
        sort: this.latestQuery.sort,
      };
      this.pageOrSortChanged.next();
    }
  }

  onSortStateChanged(sortState: SortState): void {
    // Whenever the sort state is changed, emit from searchQueryChanged.
    if (this.latestQuery) {
      this.searchQueryChanged.next({
        term: this.latestQuery.term,
        page: this.latestQuery.page,
        sort: sortState,
      });
      this.pageOrSortChanged.next();
    }
  }

  mergeQueries(newQuery: SearchQuery, oldQuery?: SearchQuery): SearchQuery {
    // Merge two query objects such that the non-essential parameters
    // (sort state) are used from the old query if the new query does
    // not specify them.
    return {
      term: newQuery.term,
      page: newQuery.page,
      sort: newQuery.sort ?? oldQuery?.sort ?? null,
    };
  }
}
