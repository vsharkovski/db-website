import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { Person } from '../person.model';
import { VariablesService } from '../variables.service';
import { WikiApiPage } from '../wiki-api-page.model';
import { WikiService } from '../wiki.service';

@Component({
  selector: 'dbw-person-detail-modal',
  templateUrl: './person-detail-modal.component.html',
  styleUrls: ['./person-detail-modal.component.css'],
})
export class PersonDetailModalComponent implements OnInit {
  @Input() person!: Person;

  wikidataUrl!: string;
  data: WikiApiPage | null = null;

  genders = {} as [number: string];
  occupations = {} as [number: string];
  citizenships = {} as [number: string];

  constructor(
    public activeModal: NgbActiveModal,
    private wikiService: WikiService,
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
    // get wiki data
    this.wikidataUrl = `https://www.wikidata.org/wiki/${this.person.wikidataCode}`;
    this.wikiService.getDataFromEnglishWiki(this.person).subscribe((data) => {
      this.data = data;
    });
  }
}
