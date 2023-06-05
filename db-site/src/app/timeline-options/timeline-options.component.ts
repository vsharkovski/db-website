import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NumberRange } from '../number-range.model';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
} from '@angular/forms';
import { VariablesService } from '../variables.service';
import { Variable } from '../variable.model';
import { TimelineOptions } from '../timeline-options.model';
import { isIntegerOrNullValidator } from '../is-integer-or-null.validator';
import { pairwise, startWith } from 'rxjs';

@Component({
  selector: 'dbw-timeline-options',
  templateUrl: './timeline-options.component.html',
  styleUrls: ['./timeline-options.component.css'],
})
export class TimelineOptionsComponent implements OnInit, OnChanges {
  form: FormGroup;

  genders: Variable[] = [];
  occupationsLevel1: Variable[] = [];
  citizenships: Variable[] = [];

  @Input() selectedYears!: NumberRange;
  @Input() selectedYearsBoundary!: NumberRange;
  @Output() optionsChanged = new EventEmitter<TimelineOptions>();
  @Output() exactYearChanged = new EventEmitter<number | null>();

  constructor(
    fb: NonNullableFormBuilder,
    private variablesService: VariablesService
  ) {
    // Create the form.
    this.form = fb.group({
      yearExact: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      citizenshipId: fb.control<number | null>(null),
      occupationLevel1Id: fb.control<number | null>(null),
      genderId: fb.control<number | null>(null),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['selectedYears'];
    if (change) {
      const isExact = this.selectedYears.min == this.selectedYears.max;
      this.yearExactField.setValue(isExact ? this.selectedYears.min : null, {
        emitEvent: false,
      });
    }
  }

  ngOnInit(): void {
    // Get the variable lists from the API, and sort them by name.
    this.variablesService.getGenders().subscribe((genders) => {
      this.genders = genders;
      this.genders.sort((a, b) => a.name.localeCompare(b.name));
    });
    this.variablesService.getOccupations().subscribe((occupations) => {
      this.occupationsLevel1 = occupations.filter((occ) => occ.type === 1);
    });
    this.variablesService.getCitizenships().subscribe((citizenships) => {
      this.citizenships = citizenships;
      this.citizenships.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Value changes.
    this.form.valueChanges.subscribe((values) => {
      if (!this.form.valid) return;
      this.optionsChanged.emit(values as TimelineOptions);
    });
    this.yearExactField.valueChanges
      .pipe(startWith(this.yearExactField.value), pairwise())
      .subscribe(([previous, current]) => {
        if (current === null) return;

        // Constrain to minimum and maximum.
        const currentConstrained = Math.max(
          this.selectedYearsBoundary.min,
          Math.min(this.selectedYearsBoundary.max, current)
        );

        if (currentConstrained != current) {
          // Current was outside ranges. Update form value.
          // This will mean that the valueChanges observable will
          // emit immediately again with values [current, currentConstrained].
          this.yearExactField.setValue(currentConstrained);
        } else if (currentConstrained != previous) {
          // Value was inside ranges and is different from previous.
          // Emit event.
          this.exactYearChanged.next(currentConstrained);
        }
      });
  }

  get yearExactField(): AbstractControl {
    return this.form.get('yearExact')!;
  }
}
