import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { Person } from '../person.model';
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

  constructor(
    public activeModal: NgbActiveModal,
    private wikiService: WikiService
  ) {}

  ngOnInit(): void {
    this.wikidataUrl = `https://www.wikidata.org/wiki/${this.person.wikidataCode}`;
    this.wikiService.getDataFromEnglishWiki(this.person).subscribe((data) => {
      this.data = data;
    });
  }
}
