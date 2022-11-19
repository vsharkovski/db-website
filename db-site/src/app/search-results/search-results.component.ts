import { Component, Input } from '@angular/core';
import { ModalService } from '../modal.service';
import { Person } from '../person.model';
import { SearchResponse } from '../search-response.model';

@Component({
  selector: 'dbw-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent {
  @Input() results?: SearchResponse;

  constructor(private modalService: ModalService) {}

  openPersonDetail(person: Person): void {
    this.modalService.openPersonDetailModal(person);
  }
}
