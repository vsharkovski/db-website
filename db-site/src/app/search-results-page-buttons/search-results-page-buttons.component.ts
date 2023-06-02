import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResponse } from '../search-response.model';

@Component({
  selector: 'dbw-search-results-page-buttons',
  templateUrl: './search-results-page-buttons.component.html',
  styleUrls: ['./search-results-page-buttons.component.css'],
})
export class SearchResultsPageButtonsComponent {
  @Input() results!: SearchResponse;
  @Input() disabled: boolean = false;

  @Output() previousPageButtonClicked = new EventEmitter<void>();
  @Output() nextPageButtonClicked = new EventEmitter<void>();

  onPreviousPageButtonClick(): void {
    if (this.results?.hasPreviousPage) {
      this.previousPageButtonClicked.emit();
    }
  }

  onNextPageButtonClick(): void {
    if (this.results?.hasNextPage) {
      this.nextPageButtonClicked.emit();
    }
  }
}
