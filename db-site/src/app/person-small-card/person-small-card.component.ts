import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Person } from '../person.model';
import { WikiApiPage } from '../wiki-api-page.model';

@Component({
  selector: 'dbw-person-small-card',
  templateUrl: './person-small-card.component.html',
  styleUrls: ['./person-small-card.component.css'],
})
export class PersonSmallCardComponent implements OnChanges {
  @Input('person') personInjected: Person | null = null;
  @Input('wikiPage') wikiPageInjected: WikiApiPage | null = null;

  person: Person | null = null;
  wikiPage: WikiApiPage | null = null;
  isDisappearing = false;

  ngOnChanges(changes: SimpleChanges): void {
    let anyNull = false;

    const changePerson = changes['personInjected'];
    if (changePerson) {
      if (changePerson.currentValue === null) {
        anyNull = true;
      } else {
        this.person = changePerson.currentValue;
      }
    }

    const changeWiki = changes['wikiPageInjected'];
    if (changeWiki) {
      if (changeWiki.currentValue === null) {
        anyNull = true;
        this.wikiPage = changeWiki.previousValue;
      } else {
        this.wikiPage = changeWiki.currentValue;
      }
    }

    this.isDisappearing = anyNull;
  }
}
