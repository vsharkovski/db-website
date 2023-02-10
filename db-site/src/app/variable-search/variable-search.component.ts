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
import {
  debounceTime,
  delay,
  distinctUntilChanged,
  merge,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { Variable } from '../variable.model';

@Component({
  selector: 'dbw-variable-search',
  templateUrl: './variable-search.component.html',
  styleUrls: ['./variable-search.component.css'],
})
export class VariableSearchComponent implements OnInit, OnChanges {
  @Input() variables!: Variable[];
  @Input('pushedSelected') recentmostPushedSelected?: Variable;

  @Output() resultSelected = new EventEmitter<Variable | null>();

  termControl = new FormControl('');
  results: Variable[] = [];

  resultsVisible: boolean = false;

  focusChanged = new Subject<boolean>();
  visibilityChangedManual = new Subject<boolean>();

  ngOnInit(): void {
    this.termControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((name) => {
        if (name === null) return;
        this.results = this.variables.filter((v) => v.name.includes(name));
      });

    merge(
      // When focus status changes, delay by 100 ms if set to true
      // and 200 ms if set to false.
      // This allows the click event to be processed before the
      // results are set to be not visible.
      this.focusChanged.pipe(
        switchMap((v) => of(v).pipe(delay(v ? 100 : 200)))
      ),

      // Manual visibility changes should be processed immediately.
      this.visibilityChangedManual
    ).subscribe((visibility) => {
      this.resultsVisible = visibility;

      if (visibility === false && this.termControl.value?.length === 0) {
        // Term is empty and results are focused. Clear.
        this.resultSelected.next(null);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recentmostPushedSelected']) {
      const pushed = changes['recentmostPushedSelected'].currentValue;
      this.termControl.setValue(pushed?.name ?? '', { emitEvent: false });
    }
  }

  onFocusIn(): void {
    this.focusChanged.next(true);
  }

  onFocusOut(): void {
    this.focusChanged.next(false);
  }

  onResultClick(result: Variable): void {
    this.visibilityChangedManual.next(false);
    this.resultSelected.next(result);

    // Update the term to the full name of the search result.
    this.termControl.setValue(result.name, { emitEvent: false });
  }
}
