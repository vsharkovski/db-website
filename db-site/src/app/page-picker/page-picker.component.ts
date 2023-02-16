import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'dbw-page-picker',
  templateUrl: './page-picker.component.html',
  styleUrls: ['./page-picker.component.css'],
})
export class PagePickerComponent implements OnInit, OnChanges {
  @Input() currentPage: number = 0;
  @Input() totalPages: number = 0;
  @Input() allowArbitraryChanging: boolean = false;
  @Input() disabled: boolean = false;

  @Output() pageChanged = new EventEmitter<number>();

  pageControl = new FormControl<number>(1);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage']) {
      this.pageControl.setValue(this.currentPage + 1);
    }
  }

  ngOnInit(): void {
    this.pageControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((page) => {
        if (page !== null) {
          this.changePage(page - 1);
        }
      });
  }

  changePage(page: number): void {
    // Restrict page within limits [0, totalPages - 1].
    page = Math.min(this.totalPages - 1, Math.max(0, page));

    if (page !== this.currentPage) {
      // Emit event upwards and set form control value.
      this.pageChanged.emit(page);
      this.pageControl.setValue(page + 1, { emitEvent: false });
      this.currentPage = page;
    }
  }
}
