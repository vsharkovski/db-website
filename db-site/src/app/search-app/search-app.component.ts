import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  startWith,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
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

  initialSearchTerm: string = '';
  initialSearchResultPage: number = 0;
  searchQueryChanged = new Subject<{ page: number; term: string }>();
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
    this.initialSearchTerm = initParams['term'] ?? '';
    this.initialSearchResultPage = initParams['page'] ?? 0;
    // whenever the search options are changed, update the route
    this.searchQueryChanged.subscribe(
      (query: { page: number; term: string }) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            term: query.term,
            page: query.page,
          },
        });
      }
    );
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
            return this.searchService.getSearchResults(
              params['term'] ?? '',
              params['page'] ?? 0
            );
          }
          return of(undefined);
        })
      )
      .subscribe((results) => {
        this.results = results;
      });
  }

  onSubmit(): void {
    this.searchOptionsSubmitted.next();
  }
}
