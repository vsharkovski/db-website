import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Subject,
  switchMap,
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

  hasAskedForResults: boolean = false;
  waitingForResults: boolean = false;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Pass initial params from route to search options
    const initParams = this.route.snapshot.queryParams;
    this.requestedQuery = {
      term: initParams['term'] ?? '',
      page: Number(initParams['page'] ?? 0),
      sort: null,
    };

    // Whenever the search options are changed, update the route
    this.searchQueryChanged.subscribe((query: SearchQuery) => {
      this.latestQuery = this.mergeQueries(query, this.latestQuery);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          term: this.latestQuery.term,
          page: this.latestQuery.page,
          sortVariable: this.latestQuery.sort?.variable ?? 'notabilityRank',
          sortDirection: this.latestQuery.sort?.direction ?? 'ascending',
        },
      });
    });

    // Whenever the route is updated or the search form is submitted,
    // search for it
    const routeChangedOrSubmitted = merge(
      this.searchOptionsSubmitted.pipe(
        map(() => this.route.snapshot.queryParams)
      ),
      this.route.queryParams
    );
    const routeParamsReadyToGetSearchResults = routeChangedOrSubmitted.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      filter((params) => params['term'])
    );
    const results$ = routeParamsReadyToGetSearchResults.pipe(
      switchMap((params) =>
        this.searchService.getSearchResults(
          params['term'] ?? '',
          params['page'] ?? 0,
          params['sortVariable'] ?? 'notabilityRank',
          params['sortDirection'] ?? 'ascending'
        )
      )
    );
    results$.subscribe((results) => {
      this.results = results;
      this.viewportScroller.scrollToAnchor('results');
    });

    // Whenever the route is changed or the search results are received,
    // update the wait status
    merge(
      routeChangedOrSubmitted.pipe(
        map((params) => (params['term'] ? true : false))
      ),
      routeParamsReadyToGetSearchResults.pipe(map(() => false))
    ).subscribe((newWaitStatus) => {
      this.waitingForResults = newWaitStatus;
      if (newWaitStatus) {
        this.hasAskedForResults = true;
      }
    });
  }

  onPageButtonClick(pageChange: number): void {
    if (
      ((pageChange === -1 && this.results?.hasPreviousPage) ||
        (pageChange === 1 && this.results?.hasNextPage)) &&
      this.latestQuery &&
      this.latestQuery.page + pageChange >= 0
    ) {
      // Update the search options component with the new query
      // This will afterwards be captured in the searchQueryChanged event
      this.requestedQuery = {
        term: this.latestQuery.term,
        page: this.latestQuery.page + pageChange,
        sort: this.latestQuery.sort,
      };
    }
  }

  onSortStateChanged(sortState: SortState): void {
    if (this.latestQuery) {
      // Fire the searchQueryChanged event with the new query
      this.searchQueryChanged.next({
        term: this.latestQuery.term,
        page: this.latestQuery.page,
        sort: sortState,
      });
    }
  }

  mergeQueries(newQuery: SearchQuery, oldQuery?: SearchQuery): SearchQuery {
    return {
      term: newQuery.term,
      page: newQuery.page,
      sort: newQuery.sort ?? oldQuery?.sort ?? null,
    };
  }
}
