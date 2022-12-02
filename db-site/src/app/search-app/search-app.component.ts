import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { SearchQuery } from '../search-query.model';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';

@Component({
  selector: 'dbw-search-app',
  templateUrl: './search-app.component.html',
  styleUrls: ['./search-app.component.css'],
})
export class SearchAppComponent implements OnInit {
  currentTab = 1;
  results?: SearchResponse;
  waitingForResponse: boolean = false;

  requestedQuery?: SearchQuery;
  latestQuery?: SearchQuery;

  searchQueryChanged = new Subject<SearchQuery>();
  searchOptionsSubmitted = new Subject<void>();

  searchSubscription?: Subscription;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // pass initial params from route to search options
    const initParams = this.route.snapshot.queryParams;
    this.requestedQuery = {
      term: initParams['term'] ?? '',
      page: Number(initParams['page']) ?? 0,
    };
    // whenever the search options are changed, update the route
    this.searchQueryChanged.subscribe((query: SearchQuery) => {
      this.latestQuery = query;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          term: query.term,
          page: query.page,
        },
      });
    });
    // whenever the route is updated or the search form is submitted,
    // search for it
    this.searchSubscription = merge(
      this.searchOptionsSubmitted.pipe(
        switchMap(() => of(this.route.snapshot.queryParams))
      ),
      this.route.queryParams
    )
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap((params) => {
          if (params['term']) {
            this.waitingForResponse = true;
            return this.searchService.getSearchResults(
              params['term'] ?? '',
              params['page'] ?? 0
            );
          }
          return of(undefined);
        })
      )
      .subscribe((results) => {
        this.waitingForResponse = false;
        this.results = results;
      });
  }

  onPreviousPageRequested() {
    if (
      this.results?.hasPreviousPage &&
      this.latestQuery &&
      this.latestQuery.page > 0
    ) {
      this.requestedQuery = {
        term: this.latestQuery.term,
        page: this.latestQuery.page - 1,
      };
    }
  }

  onNextPageRequested() {
    if (this.results?.hasNextPage && this.latestQuery) {
      this.requestedQuery = {
        term: this.latestQuery.term,
        page: this.latestQuery.page + 1,
      };
    }
  }
}
