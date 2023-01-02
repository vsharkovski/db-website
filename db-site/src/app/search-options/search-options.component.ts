import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { delayWhen, ReplaySubject, skip } from 'rxjs';
import { isIntegerOrNullValidator } from '../is-integer-or-null.validator';
import { Variable } from '../variable.model';
import { VariablesService } from '../variables.service';

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit, OnChanges {
  readonly LIFE_YEAR_MIN = -3500;
  readonly LIFE_YEAR_MAX = 2020;
  readonly SAFE_NAME_PATTERN = '^[^,:!=><~]+$';
  readonly termRegex: RegExp;

  form: FormGroup;

  genders: Variable[] = [];
  occupations: Variable[] = [];
  citizenships: Variable[] = [];

  variablesLoaded = new ReplaySubject<void>();
  pushedTerms = new ReplaySubject<string>();

  @Input('pushedTerm') recentmostPushedTerm?: string;
  @Output() termChanged = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();

  constructor(
    fb: NonNullableFormBuilder,
    private variablesService: VariablesService
  ) {
    // Create the form.
    this.form = fb.group({
      name: fb.control('', [
        Validators.maxLength(200),
        Validators.pattern(this.SAFE_NAME_PATTERN),
      ]),
      nameSearchMode: fb.control<'anywhere' | 'start'>('anywhere'),
      birthMin: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      birthMax: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      deathMin: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      deathMax: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      citizenship: fb.control<number | null>(null),
      gender: fb.control<number | null>(null),
    });

    // Create the regular expression for terms.
    const searchOperators = [':', '!', '>=', '>', '<=', '<', '~'];
    const searchOperatorsJoinedOr = searchOperators.join('|');
    const forbiddenCharacters = `,${searchOperators.join('')}`;
    const punctuation = `!"#$%&'()*+,-./:;<=>?@[]^_{|}~\``;
    const punctuationEscaped = punctuation.replace(
      /[.*+?^${}()|[\]\\\/]/g,
      '\\$&'
    );
    const regexpString = [
      `(\\w+?)`,
      `(${searchOperatorsJoinedOr})`,
      `([${punctuationEscaped}]?)`,
      `([^${forbiddenCharacters}]+?)`,
      `([${punctuationEscaped}]?)`,
      `,`,
    ].join('');
    this.termRegex = new RegExp(regexpString, 'g');
  }

  ngOnInit(): void {
    // Get the variable lists from the API, and sort them by name.
    this.variablesService.getGenders().subscribe((genders) => {
      this.genders = genders;
      this.genders.sort((a, b) => a.name.localeCompare(b.name));
      this.variablesLoaded.next();
    });
    this.variablesService.getOccupations().subscribe((occupations) => {
      this.occupations = occupations;
      this.variablesLoaded.next();
    });
    this.variablesService.getCitizenships().subscribe((citizenships) => {
      this.citizenships = citizenships;
      this.citizenships.sort((a, b) => a.name.localeCompare(b.name));
      this.variablesLoaded.next();
    });

    // Consume any pushed term strings, but only after all variables
    // have been loaded.
    this.pushedTerms
      .pipe(delayWhen(() => this.variablesLoaded.pipe(skip(2))))
      .subscribe((term) => this.pushTermToForm(term));

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
    if (changes['recentmostPushedTerm']) {
      const term = changes['recentmostPushedTerm'].currentValue;
      if (term !== null && term !== undefined) {
        this.pushedTerms.next(term);
      }
    }
  }

  compileTermFromFormValues(values: FormValues): string {
    let term = '';
    if (values.name) {
      if (values.nameSearchMode === 'anywhere') {
        term += `name:*${values.name}*,`;
      } else {
        term += `name:${values.name}*,`;
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

  private pushTermToForm(term: string): void {
    const criteria = [...`${term},`.matchAll(this.termRegex)].map((match) => ({
      key: match[1],
      operation: match[2],
      value: match[4],
      prefix: match[3],
      suffix: match[5],
    }));

    const values: FormValues = {
      name: '',
      nameSearchMode: 'anywhere',
      birthMin: null,
      birthMax: null,
      deathMin: null,
      deathMax: null,
      citizenship: null,
      gender: null,
    };

    for (let c of criteria) {
      if (c.key == 'name' && c.operation == ':') {
        if (!c.prefix.includes('*')) {
          values.nameSearchMode = 'start';
        }
        values.name = c.value;
      } else if (c.key == 'birth') {
        let num = Number(c.value);
        if (Number.isInteger(num)) {
          if (c.prefix == '-') {
            num = -num;
          }
          if (c.operation == '>=') {
            values.birthMin = num;
          } else if (c.operation == '<=') {
            values.birthMax = num;
          }
        }
      } else if (c.key == 'death') {
        let num = Number(c.value);
        if (Number.isInteger(num)) {
          if (c.prefix == '-') {
            num = -num;
          }
          if (c.operation == '>=') {
            values.deathMin = num;
          } else if (c.operation == '<=') {
            values.deathMax = num;
          }
        }
      } else if (c.key == 'citizenship1BId' && c.operation == ':') {
        const id = Number(c.value);
        if (this.citizenships.find((item) => item.id === id)) {
          values.citizenship = id;
        }
      } else if (c.key == 'genderId' && c.operation == ':') {
        const id = Number(c.value);
        if (this.genders.find((item) => item.id === id)) {
          values.gender = id;
        }
      }
    }

    this.form.setValue(values);
  }

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
