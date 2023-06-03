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
import { PersonParametersService } from '../person-parameters.service';

@Component({
  selector: 'dbw-timeline-options',
  templateUrl: './timeline-options.component.html',
  styleUrls: ['./timeline-options.component.css'],
})
export class TimelineOptionsComponent implements OnInit, OnChanges {
  lifeYearMin = -3500;
  lifeYearMax = 2020;

  form: FormGroup;

  genders: Variable[] = [];
  occupationsLevel1: Variable[] = [];
  citizenships: Variable[] = [];

  @Input() selectedYears!: NumberRange;
  @Output() optionsChanged = new EventEmitter<TimelineOptions>();
  @Output() exactYearChanged = new EventEmitter<number | null>();

  constructor(
    fb: NonNullableFormBuilder,
    private variablesService: VariablesService,
    private personParametersService: PersonParametersService
  ) {
    this.lifeYearMin = this.personParametersService.LIFE_YEAR_MIN;
    this.lifeYearMax = this.personParametersService.LIFE_YEAR_MAX;

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
    this.yearExactField.valueChanges.subscribe((value) =>
      this.exactYearChanged.next(value)
    );
  }

  get yearExactField(): AbstractControl {
    return this.form.get('yearExact')!;
  }
}
