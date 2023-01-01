import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  skip,
  Subject,
  switchMap,
} from 'rxjs';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';
import { SortState } from '../sort-state.model';

const DEFAULT_SORT_STATE: SortState = {
  variable: 'notabilityIndex',
  direction: 'descending',
};

@Component({
  selector: 'dbw-search-app',
  templateUrl: './search-app.component.html',
  styleUrls: ['./search-app.component.css'],
})
export class SearchAppComponent implements OnInit {
  results?: SearchResponse;
  latestPage!: number;

  termChanged = new BehaviorSubject<string>('');
  pageChanged = new BehaviorSubject<number>(0);
  sortStateChanged = new BehaviorSubject<SortState>(DEFAULT_SORT_STATE);

  searchOptionsSubmitted = new Subject<void>();

  hasAskedForResults: boolean = false;
  waitingForResults: boolean = false;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Whenever the search term, page, or sort state is changed, update the
    // route with the new parameters.
    combineLatest([
      this.termChanged,
      this.pageChanged,
      this.sortStateChanged,
    ]).subscribe(([term, page, sortState]) => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          term: term,
          page: page,
          sortVariable: sortState.variable,
          sortDirection: sortState.direction,
        },
      });
    });

    const resultsReceived = new Subject<void>();

    // Observable which, whenever the route is updated or the search form is
    // submitted, filters unnecessary options using debounceTime,
    // distinctUntilChanged and by making sure the search query has a term.
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

    // Observable which asks the API for results.
    const results$ = readyToAskForResults.pipe(
      switchMap((params) =>
        this.searchService.getSearchResults(
          params['term'] ?? '',
          params['page'] ?? 0,
          params['sortVariable'] ?? DEFAULT_SORT_STATE.variable,
          params['sortDirection'] ?? DEFAULT_SORT_STATE.direction
        )
      )
    );

    // Subscribe to the observable described above. Whenever results are received,
    // update the internal results object and emit from resultsReceived
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
      merge(this.pageChanged, this.sortStateChanged).pipe(
        // Skip the two initial emmissions, one from each observable.
        skip(2),
        map(() => true)
      )
    ).subscribe((newWaitStatus) => {
      this.waitingForResults = newWaitStatus;
      if (newWaitStatus) {
        this.hasAskedForResults = true;
      }
    });
  }

  onPageButtonClick(pageChange: number): void {
    // Whenever the page is changed and it is possible to move to the new page,
    // emit from the appropriate observable.
    if (
      ((pageChange === -1 && this.results?.hasPreviousPage) ||
        (pageChange === 1 && this.results?.hasNextPage)) &&
      this.latestPage + pageChange >= 0
    ) {
      this.pageChanged.next(this.latestPage + pageChange);
    }
  }

  onSortStateChanged(sortState: SortState): void {
    // Whenever the sort state is changed, emit from the appropriate observable.
    // The page is also reset to 0.
    this.sortStateChanged.next(sortState);
    this.pageChanged.next(0);
  }
}
