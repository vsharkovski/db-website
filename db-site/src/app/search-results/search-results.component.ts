import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalService } from '../modal.service';
import { Person } from '../person.model';
import { SearchResponse } from '../search-response.model';
import { SortState } from '../sort-state.model';
import { VariablesService } from '../variables.service';

@Component({
  selector: 'dbw-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit {
  genders = {} as [number: string];
  occupations = {} as [number: string];
  citizenships = {} as [number: string];

  @Input() results?: SearchResponse;
  @Input() waitingForResponse: boolean = false;
  @Output() sortStateChanged = new EventEmitter<SortState>();

  constructor(
    private modalService: ModalService,
    private variablesService: VariablesService
  ) {}

  ngOnInit(): void {
    // get variables
    this.variablesService
      .getGenderMap()
      .subscribe((genders) => (this.genders = genders));
    this.variablesService
      .getOccupationMap()
      .subscribe((occupations) => (this.occupations = occupations));
    this.variablesService
      .getCitizenshipMap()
      .subscribe((citizenships) => (this.citizenships = citizenships));
  }

  openPersonDetail(person: Person): void {
    this.modalService.openPersonDetailModal(person);
  }

  onSortIndicatorClick(variable: SortState['variable']): void {
    if (!this.results) {
      return;
    }
    if (this.results.sort.variable == variable) {
      // same variable clicked, flip direction
      const newDirection: SortState['direction'] =
        this.results.sort.direction === 'ascending'
          ? 'descending'
          : 'ascending';
      this.sortStateChanged.emit({
        variable: variable,
        direction: newDirection,
      });
    } else {
      // sort by new variable
      this.sortStateChanged.emit({
        variable: variable,
        direction: 'descending',
      });
    }
  }
}
