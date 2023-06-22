import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonDetailModalComponent } from './person-detail-modal/person-detail-modal.component';
import { Person } from './person.model';
import { WikiApiPage } from './wiki-api-page.model';
import { delay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _isPersonDetailModalOpen = false;

  constructor(private ngbModal: NgbModal) {
    // Delay by 10ms to prevent instantaneous modal closing+opening bugs
    // that check if a modal is open before opening a new one.
    this.ngbModal.activeInstances.pipe(delay(10)).subscribe((refs) => {
      this._isPersonDetailModalOpen =
        refs.filter(
          (ref) => ref.componentInstance instanceof PersonDetailModalComponent
        ).length > 0;
    });
  }

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

  get isPersonDetailModalOpen(): boolean {
    return this._isPersonDetailModalOpen;
  }
}
