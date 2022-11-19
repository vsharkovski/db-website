import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { Person } from '../person.model';
import { WikiService } from '../wiki.service';

@Component({
  selector: 'dbw-person-detail-modal',
  templateUrl: './person-detail-modal.component.html',
  styleUrls: ['./person-detail-modal.component.css'],
})
export class PersonDetailModalComponent implements OnInit {
  @Input() person!: Person;
  wikidataUrl!: string;
  imageSource: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private wikiService: WikiService
  ) {}

  ngOnInit(): void {
    this.wikidataUrl = `https://www.wikidata.org/wiki/${this.person.wikidataCode}`;
    this.wikiService
      .getImageFromEnglishWiki(this.person)
      .subscribe((source) => (this.imageSource = source));
  }
}
