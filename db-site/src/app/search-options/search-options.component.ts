import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { isIntegerOrNullValidator } from '../is-integer-or-null.validator';
import { Variable } from '../variable.model';
import { VariablesService } from '../variables.service';

interface FormValues {
  name: string;
  nameSearchMode: 'anywhere' | 'start';
  birthMin: number | null;
  birthMax: number | null;
  deathMin: number | null;
  deathMax: number | null;
  citizenship: number | null;
  gender: number | null;
}

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit, OnChanges {
  readonly LIFE_YEAR_MIN = -3500;
  readonly LIFE_YEAR_MAX = 2020;
  readonly SAFE_NAME_PATTERN = '^[^,:!=><~]+$';

  form = this.formBuilder.group({
    name: [
      '',
      [Validators.maxLength(200), Validators.pattern(this.SAFE_NAME_PATTERN)],
    ],
    nameSearchMode: ['anywhere'],
    birthMin: [null, [isIntegerOrNullValidator]],
    birthMax: [null, [isIntegerOrNullValidator]],
    deathMin: [null, [isIntegerOrNullValidator]],
    deathMax: [null, [isIntegerOrNullValidator]],
    citizenship: [''],
    gender: [''],
  });

  genders: Variable[] = [];
  occupations: Variable[] = [];
  citizenships: Variable[] = [];

  @Input() requestedTerm?: string;
  @Output() termChanged = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();

  constructor(
    private formBuilder: FormBuilder,
    private variablesService: VariablesService
  ) {}

  ngOnInit(): void {
    // Get the variable lists from the API, and sort them by name.
    this.variablesService.getGenders().subscribe((genders) => {
      this.genders = genders;
      this.genders.sort((a, b) => a.name.localeCompare(b.name));
    });
    this.variablesService.getOccupations().subscribe((occupations) => {
      this.occupations = occupations;
    });
    this.variablesService.getCitizenships().subscribe((citizenships) => {
      this.citizenships = citizenships;
      this.citizenships.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Whenever the form is changed, emit the new term.
    this.form.valueChanges.subscribe((values) => {
      if (this.form.valid) {
        this.termChanged.emit(
          this.compileTermFromFormValues(values as FormValues)
        );
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestedTerm']) {
      this.pushTermToForm(changes['requestedTerm'].currentValue);
    }
  }

  compileTermFromFormValues(values: FormValues): string {
    let term = '';
    if (values.name) {
      if (values.nameSearchMode === 'anywhere') {
        term += `name:*${values.name}*`;
      } else {
        term += `name:${values.name}*`;
      }
    }
    if (values.birthMin !== null) {
      term += `birth>=${this.clampLifeYear(values.birthMin)},`;
    }
    if (values.birthMax !== null) {
      term += `birth<=${this.clampLifeYear(values.birthMax)},`;
    }
    if (values.deathMin !== null) {
      term += `death>=${this.clampLifeYear(values.deathMin)},`;
    }
    if (values.deathMax !== null) {
      term += `death<=${this.clampLifeYear(values.deathMax)},`;
    }
    if (values.citizenship) {
      term += `citizenship1BId:${values.citizenship},`;
    }
    if (values.gender) {
      term += `genderId:${values.gender},`;
    }
    if (term.endsWith(',')) {
      term = term.substring(0, term.length - 1);
    }
    return term;
  }

  private pushTermToForm(term: string): void {}

  private clampLifeYear(year: number): number {
    return Math.min(Math.max(this.LIFE_YEAR_MIN, year), this.LIFE_YEAR_MAX);
  }

  get pageField(): AbstractControl {
    return this.form.get('page')!;
  }

  get nameField(): AbstractControl {
    return this.form.get('name')!;
  }

  get nameSearchModeField(): AbstractControl {
    return this.form.get('nameSearchMode')!;
  }

  get birthMinField(): AbstractControl {
    return this.form.get('birthMin')!;
  }

  get birthMaxField(): AbstractControl {
    return this.form.get('birthMax')!;
  }

  get deathMinField(): AbstractControl {
    return this.form.get('deathMin')!;
  }

  get deathMaxField(): AbstractControl {
    return this.form.get('deathMax')!;
  }

  get citizenshipField(): AbstractControl {
    return this.form.get('citizenship')!;
  }

  get genderField(): AbstractControl {
    return this.form.get('gender')!;
  }
}
