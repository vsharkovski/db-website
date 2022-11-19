import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { isIntegerOrNullValidator } from '../is-integer-or-null.validator';
import { SearchQuery } from '../search-query.model';
import citizenship1BData from '../../assets/data/citizenship1B.json';
import genderData from '../../assets/data/gender.json';

interface OptionPair {
  label: string;
  value: string;
}

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit {
  readonly lifeYearMin: number = -3500;
  readonly lifeYearMax: number = 2020;
  readonly safeWildcardPattern = '^[*A-Za-z\\d\\s_()]+$';
  readonly safeNonWildcardPattern = '^[A-Za-z\\d\\s_()]+$';
  readonly citizenship1BOptions: string[] = citizenship1BData;
  readonly genderOptions: string[] = genderData;

  form = this.formBuilder.group({
    page: [0, [Validators.min(0), Validators.max(10000)]],
    name: [
      '',
      [Validators.maxLength(200), Validators.pattern(this.safeWildcardPattern)],
    ],
    birthMin: [
      this.lifeYearMin,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    birthMax: [
      this.lifeYearMax,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    deathMin: [
      this.lifeYearMin,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    deathMax: [
      this.lifeYearMax,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    citizenship: [''],
    gender: [''],
  });

  @Input() initialPage: number = 0;
  @Input() initialTerm: string = '';

  @Output() queryChanged = new EventEmitter<SearchQuery>();
  @Output() submitted = new EventEmitter<void>();

  compiledTerm: string = '';

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    // set initial options
    this.pushQueryToOptions({ page: this.initialPage, term: this.initialTerm });
    // when things are changed, send signal up
    this.form.valueChanges.subscribe((values) => {
      if (this.form.valid) {
        this.queryChanged.emit(this.pullQueryFromOptions());
      }
    });
    // when query is changed inside here, update compiledTerm
    // (debugging purposes)
    this.queryChanged.subscribe((query) => {
      this.compiledTerm = query.term;
    });
  }

  pushQueryToOptions(query: SearchQuery): void {
    this.compiledTerm = query.term;
    this.pageField.setValue(query.page);
  }

  pullQueryFromOptions(): SearchQuery {
    if (!this.form.valid) {
      return { page: 0, term: '' };
    }
    let term = '';
    if (this.nameField.value) term += `name:${this.nameField.value},`;
    if (this.birthMinField.value !== null)
      term += `birth>=${Math.max(this.lifeYearMin, this.birthMinField.value)},`;
    if (this.birthMaxField.value !== null)
      term += `birth<=${Math.min(this.lifeYearMax, this.birthMaxField.value)},`;
    if (this.deathMinField.value !== null)
      term += `death>=${Math.max(this.lifeYearMin, this.deathMinField.value)},`;
    if (this.deathMaxField.value !== null)
      term += `death<=${Math.max(this.lifeYearMax, this.deathMaxField.value)},`;
    if (this.citizenshipField.value)
      term += `citizenship1B:${this.citizenshipField.value},`;
    if (this.genderField.value) term += `gender:${this.genderField.value},`;
    if (term.endsWith(',')) {
      term = term.substring(0, term.length - 1);
    }
    return {
      page: this.pageField.value ?? 0,
      term: term,
    };
  }

  get pageField(): AbstractControl {
    return this.form.get('page')!;
  }

  get nameField(): AbstractControl {
    return this.form.get('name')!;
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
