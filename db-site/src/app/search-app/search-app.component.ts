import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Subject,
  switchMap,
} from 'rxjs';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';
import {
  SortState,
  SortStateVariableArray,
  SortStateDirectionArray,
} from '../sort-state.model';

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
  termPushedToOptions?: string;

  termSet = new BehaviorSubject<string>('');
  pageSet = new BehaviorSubject<number>(0);
  sortStateSet = new BehaviorSubject<SortState>(DEFAULT_SORT_STATE);

  searchOptionsSubmitted = new Subject<void>();

  hasAskedForResults: boolean = false;
  waitingForResults: boolean = false;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read initial parameters from the route.
    this.readQueryParams(this.route.snapshot.queryParams);

    // Whenever the search term, page, or sort state is changed, and the
    // term is non-empty, update the route with the new parameters.
    const querySet = combineLatest([
      this.termSet.pipe(distinctUntilChanged()),
      this.pageSet.pipe(distinctUntilChanged()),
      this.sortStateSet.pipe(distinctUntilChanged()),
    ]);

    querySet
      .pipe(
        filter((data) => (data[0] === undefined ? false : data[0].length > 0))
      )
      .subscribe(([term, page, sortState]) => {
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
      // each source observable would be considered different
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
    const resultsReceived = new Subject<void>();

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
      querySet.pipe(
        map((data) => (data[0] === undefined ? false : data[0].length > 0))
      )
    ).subscribe((newWaitStatus) => {
      this.waitingForResults = newWaitStatus;
      if (newWaitStatus) {
        this.hasAskedForResults = true;
      }
    });
  }

  private readQueryParams(params: Params): void {
    if (params['term'] !== null) {
      this.termSet.next(params['term']);
      this.termPushedToOptions = params['term'];
    }

    if (params['page'] !== null) {
      const page = Number(params['page']);
      if (Number.isInteger(page) && page >= 0) {
        this.pageSet.next(page);
      }
    }

    if (params['sortVariable'] || params['sortDirection']) {
      const variable = SortStateVariableArray.includes(params['sortVariable'])
        ? params['sortVariable']
        : DEFAULT_SORT_STATE.variable;
      const dir = SortStateDirectionArray.includes(params['sortDirection'])
        ? params['sortDirection']
        : DEFAULT_SORT_STATE.direction;
      this.sortStateSet.next({ variable: variable, direction: dir });
    }
  }

  onPageButtonClick(pageChange: number): void {
    // Whenever the page is changed and it is possible to move to the new page,
    // emit from the appropriate observable.
    const latestPage = Number(this.route.snapshot.queryParams['page'] ?? '0');
    if (
      ((pageChange === -1 && this.results?.hasPreviousPage) ||
        (pageChange === 1 && this.results?.hasNextPage)) &&
      latestPage + pageChange >= 0
    ) {
      this.pageSet.next(latestPage + pageChange);
    }
  }

  onSortStateSet(sortState: SortState): void {
    // Whenever the sort state is changed, emit from the appropriate observable.
    // The page is also reset to 0.
    this.sortStateSet.next(sortState);
    this.pageSet.next(0);
  }

  onTermSet(term: string): void {
    // Whenever the term is changed, emit from the appropriate observable.
    // The page is also reset to 0.
    this.termSet.next(term);
    this.pageSet.next(0);
  }
}
