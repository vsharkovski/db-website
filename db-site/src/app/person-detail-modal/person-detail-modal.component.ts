import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReplaySubject, skip } from 'rxjs';
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
  @Input() data: WikiApiPage | null = null;

  citizenshipsLabel: string = '';
  citizenshipsValue: string = '';
  occupationsValue: string = '';

  variablesLoaded = new ReplaySubject<void>();

  wikidataUrl!: string;

  genders = {} as [number: string];
  occupations = {} as [number: string];
  citizenships = {} as [number: string];

  waitingForResponse: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private wikiService: WikiService,
    private variablesService: VariablesService
  ) {}

  ngOnInit(): void {
    // Get variables data.
    this.variablesService.getGenderMap().subscribe((genders) => {
      this.genders = genders;
      this.variablesLoaded.next();
    });
    this.variablesService.getOccupationMap().subscribe((occupations) => {
      this.occupations = occupations;
      this.variablesLoaded.next();
    });
    this.variablesService.getCitizenshipMap().subscribe((citizenships) => {
      this.citizenships = citizenships;
      this.variablesLoaded.next();
    });

    // When all 3 variable groups have been loaded, update strings.
    this.variablesLoaded.pipe(skip(2)).subscribe(() => {
      if (this.person.citizenship1BId !== null) {
        if (this.person.citizenship2BId === null) {
          this.citizenshipsLabel = 'Citizenship';
          this.citizenshipsValue =
            this.citizenships[this.person.citizenship1BId!];
        } else {
          this.citizenshipsLabel = 'Citizenships';
          this.citizenshipsValue = `${
            this.citizenships[this.person.citizenship1BId!]
          }, ${this.citizenships[this.person.citizenship2BId]}`;
        }
      }

      if (this.person.level1MainOccId !== null) {
        this.occupationsValue = this.occupations[this.person.level1MainOccId!];
        if (this.person.level3MainOccId !== null) {
          this.occupationsValue = `${this.occupationsValue} (${
            this.occupations[this.person.level3MainOccId]
          })`;
        }
      }
    });

    // Get wiki data.
    if (this.data === null) {
      this.waitingForResponse = true;
      this.wikidataUrl = `https://www.wikidata.org/wiki/Q${this.person.wikidataCode}`;
      this.wikiService.getDataFromEnglishWiki(this.person).subscribe((data) => {
        this.waitingForResponse = false;
        this.data = data;
      });
    }
  }
}
