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
import { SearchQuery } from '../search-query.model';
import { Variable } from '../variable.model';
import { VariablesService } from '../variables.service';

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit, OnChanges {
  readonly lifeYearMin: number = -3500;
  readonly lifeYearMax: number = 2020;
  readonly safeNamePattern = '^[^,:!=><~]+$';

  form = this.formBuilder.group({
    page: [0, [Validators.min(0), Validators.max(10000)]],
    name: [
      '',
      [Validators.maxLength(200), Validators.pattern(this.safeNamePattern)],
    ],
    nameSearchMode: ['start'],
    birthMin: [
      null,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    birthMax: [
      null,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    deathMin: [
      null,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    deathMax: [
      null,
      [
        // Validators.min(this.lifeYearMin),
        // Validators.max(this.lifeYearMax),
        isIntegerOrNullValidator,
      ],
    ],
    citizenship: [''],
    gender: [''],
  });

  genders: Variable[] = [];
  occupations: Variable[] = [];
  citizenships: Variable[] = [];

  @Input() requestedQuery?: SearchQuery;

  @Output() queryChanged = new EventEmitter<SearchQuery>();
  @Output() submitted = new EventEmitter<void>();

  compiledTerm: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private variablesService: VariablesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['requestedQuery'];
    if (change && change.currentValue) {
      // push to options
      this.pushQueryToOptions({ ...change.currentValue }, true);
    }
  }

  ngOnInit(): void {
    // get variables
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
    // when things are changed, send signal up
    this.form.valueChanges.subscribe((values) => {
      if (this.form.valid) {
        // console.log('search options: emitting queryChanged');
        this.queryChanged.emit(this.pullQueryFromOptions());
      }
    });
    // when query is changed here, update compiled term (debugging purposes)
    this.queryChanged.subscribe((query) => {
      this.compiledTerm = query.term;
    });
  }

  pushQueryToOptions(query: SearchQuery, notifyUp: boolean = false): void {
    this.compiledTerm = query.term;
    this.pageField.setValue(query.page);
    if (notifyUp) {
      this.queryChanged.emit(query);
    }
  }

  pullQueryFromOptions(): SearchQuery {
    if (!this.form.valid) {
      return { page: 0, term: '', sort: null };
    }
    let term = '';
    if (this.nameField.value) {
      const shouldMatchAnyBefore =
        this.nameSearchModeField.value === 'anywhere';
      term += `name:${shouldMatchAnyBefore ? '*' : ''}${
        this.nameField.value
      }*,`;
    }
    if (this.birthMinField.value !== null)
      term += `birth>=${Math.max(this.lifeYearMin, this.birthMinField.value)},`;
    if (this.birthMaxField.value !== null)
      term += `birth<=${Math.min(this.lifeYearMax, this.birthMaxField.value)},`;
    if (this.deathMinField.value !== null)
      term += `death>=${Math.max(this.lifeYearMin, this.deathMinField.value)},`;
    if (this.deathMaxField.value !== null)
      term += `death<=${Math.max(this.lifeYearMax, this.deathMaxField.value)},`;
    if (this.citizenshipField.value)
      term += `citizenship1BId:${this.citizenshipField.value},`;
    if (this.genderField.value) term += `genderId:${this.genderField.value},`;
    if (term.endsWith(',')) {
      term = term.substring(0, term.length - 1);
    }
    return {
      term: term,
      page: 0,
      sort: { variable: 'notabilityRank', direction: 'ascending' },
    };
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
