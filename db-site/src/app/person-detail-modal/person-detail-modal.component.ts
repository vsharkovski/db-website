import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from '../person.model';
import { WikidataService } from '../wikidata.service';

@Component({
  selector: 'dbw-person-detail-modal',
  templateUrl: './person-detail-modal.component.html',
  styleUrls: ['./person-detail-modal.component.css'],
})
export class PersonDetailModalComponent implements OnInit {
  @Input() person!: Person;
  imageSource: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private wikidataService: WikidataService
  ) {}

  ngOnInit(): void {
    this.wikidataService
      .getImageFromEnglishWiki(this.person)
      .subscribe((source) => (this.imageSource = source));
  }
}
