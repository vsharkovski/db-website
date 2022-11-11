import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SearchResponse } from '../search-response.model';
import { SearchService } from '../search.service';

@Component({
  selector: 'dbw-search-app',
  templateUrl: './search-app.component.html',
  styleUrls: ['./search-app.component.css'],
})
export class SearchAppComponent implements OnInit {
  form = this.formBuilder.group({
    term: [''],
    page: 0,
  });

  currentTab = 1;
  results?: SearchResponse;

  constructor(
    private formBuilder: FormBuilder,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {}

  onSubmit(): void {
    this.searchService
      .getSearchResults(
        this.form.get('term')!.value ?? '',
        this.form.get('page')!.value ?? 0
      )
      .subscribe((results) => {
        this.results = results;
      });
  }
}
