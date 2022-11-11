import { Component, Input, OnInit } from '@angular/core';
import { SearchResponse } from '../search-response.model';

@Component({
  selector: 'dbw-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit {
  @Input() results?: SearchResponse;

  constructor() {}

  ngOnInit(): void {}
}
