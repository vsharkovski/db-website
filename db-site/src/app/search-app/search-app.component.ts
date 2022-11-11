import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';

interface searchTermPagePair {
  term: string;
}

@Component({
  selector: 'dbw-search-app',
  templateUrl: './search-app.component.html',
  styleUrls: ['./search-app.component.css'],
})
export class SearchAppComponent implements OnInit {
  currentTab = 1;
  results?: SearchResponse;
  searchTerm: string = '';
  searchResultPage: number = 0;

  searchTermChanged = new BehaviorSubject<string>('');
  searchResultPageNumberChanged = new BehaviorSubject<number>(0);

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // TODO: Don't reset term from URL when loading
    combineLatest([
      this.searchTermChanged,
      this.searchResultPageNumberChanged,
    ]).subscribe(([term, page]) => {
      this.searchTerm = term;
      this.searchResultPage = page;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          term: term,
          page: page,
        },
      });
    });
  }

  onSearchTermChanged(term: string): void {
    this.searchTermChanged.next(term);
  }

  onSearchResultPageChanged(page: number): void {
    this.searchResultPageNumberChanged.next(page);
  }

  onSubmit(): void {
    this.searchService
      .getSearchResults(this.searchTerm, this.searchResultPage)
      .subscribe((results) => {
        this.results = results;
      });
  }
}
