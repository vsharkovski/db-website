import { Component, Input } from '@angular/core';
import { Person } from '../person.model';
import { WikiApiPage } from '../wiki-api-page.model';

@Component({
  selector: 'dbw-person-small-card',
  templateUrl: './person-small-card.component.html',
  styleUrls: ['./person-small-card.component.css'],
})
export class PersonSmallCardComponent {
  @Input() person!: Person;
  @Input() wikiPage: WikiApiPage | null = null;
}
