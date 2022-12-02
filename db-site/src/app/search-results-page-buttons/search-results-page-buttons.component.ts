import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SearchResponse } from '../search-response.model';

@Component({
  selector: 'dbw-search-results-page-buttons',
  templateUrl: './search-results-page-buttons.component.html',
  styleUrls: ['./search-results-page-buttons.component.css'],
})
export class SearchResultsPageButtonsComponent implements OnChanges {
  @Input() results!: SearchResponse;
  @Input() waitingForResponse: boolean = false;
  @Output() previousPageButtonClicked = new EventEmitter<void>();
  @Output() nextPageButtonClicked = new EventEmitter<void>();

  clickedWithoutResponse: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    const waitingForResponseChange = changes['waitingForResponse'];
    if (waitingForResponseChange) {
      if (waitingForResponseChange.currentValue === false) {
        this.clickedWithoutResponse = false;
      }
    }
  }

  onPreviousPageButtonClick() {
    if (this.results?.hasPreviousPage) {
      this.clickedWithoutResponse = true;
      this.previousPageButtonClicked.emit();
    }
  }

  onNextPageButtonClick() {
    if (this.results?.hasNextPage) {
      this.clickedWithoutResponse = true;
      this.nextPageButtonClicked.emit();
    }
  }
}
