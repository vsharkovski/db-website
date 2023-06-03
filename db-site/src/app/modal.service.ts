import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonDetailModalComponent } from './person-detail-modal/person-detail-modal.component';
import { Person } from './person.model';
import { WikiApiPage } from './wiki-api-page.model';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private ngbModal: NgbModal) {}

  openPersonDetailModal(person: Person, wikiData?: WikiApiPage): void {
    const modal = this.ngbModal.open(PersonDetailModalComponent, {
      // size: 'xl',
      scrollable: true,
    });
    modal.componentInstance.person = person;
    if (wikiData) {
      modal.componentInstance.data = wikiData;
    }
  }
}
