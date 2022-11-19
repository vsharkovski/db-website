import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonDetailModalComponent } from './person-detail-modal/person-detail-modal.component';
import { Person } from './person.model';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private ngbModal: NgbModal) {}

  openPersonDetailModal(person: Person): void {
    const modal = this.ngbModal.open(PersonDetailModalComponent);
    modal.componentInstance.person = person;
  }
}
