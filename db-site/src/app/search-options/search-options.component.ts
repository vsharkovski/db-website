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
import { SearchService } from '../search.service';
import { Variable } from '../variable.model';
import { VariablesService } from '../variables.service';
import { SearchParameters } from '../search-parameters.model';
import { PersonParametersService } from '../person-parameters.service';

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit, OnChanges {
  readonly SAFE_NAME_PATTERN = '^[^,:!=><~]+$';
  lifeYearMin = -3500;
  lifeYearMax = 2020;

  form: FormGroup;

  genders: Variable[] = [];
  occupationsLevel1: Variable[] = [];
  occupationsLevel3: Variable[] = [];
  citizenships: Variable[] = [];

  recentmostPushedOccupationLevel3?: Variable;

  variablesLoaded = new ReplaySubject<void>();
  pushedTerms = new ReplaySubject<string>();

  @Input('pushedTerm') recentmostPushedTerm?: string;
  @Input() shouldShowResultsLoadedMessage?: boolean;
  @Output() termChanged = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<string>();

  constructor(
    fb: NonNullableFormBuilder,
    private variablesService: VariablesService,
    private searchService: SearchService,
    private personParametersService: PersonParametersService
  ) {
    // Create the form.
    this.form = fb.group({
      name: fb.control('', [
        Validators.maxLength(200),
        Validators.pattern(this.SAFE_NAME_PATTERN),
      ]),
      birthMin: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      birthMax: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      deathMin: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      deathMax: fb.control<number | null>(null, [isIntegerOrNullValidator]),
      citizenshipId: fb.control<number | null>(null),
      occupationLevel1Id: fb.control<number | null>(null),
      occupationLevel3Id: fb.control<string | null>(null),
      genderId: fb.control<number | null>(null),
      notabilityMin: fb.control<number | null>(null),
      notabilityMax: fb.control<number | null>(null),
      advancedMode: fb.control<boolean>(false),
    });
  }

  ngOnInit(): void {
    this.lifeYearMin = this.personParametersService.LIFE_YEAR_MIN;
    this.lifeYearMax = this.personParametersService.LIFE_YEAR_MAX;

    // Get the variable lists from the API, and sort them by name.
    this.variablesService.getGenders().subscribe((genders) => {
      this.genders = genders;
      this.genders.sort((a, b) => a.name.localeCompare(b.name));
      this.variablesLoaded.next();
    });
    this.variablesService.getOccupations().subscribe((occupations) => {
      this.occupationsLevel1 = occupations.filter((occ) => occ.type === 1);
      this.occupationsLevel3 = occupations.filter((occ) => occ.type === 3);

      // Sort occupations level 3 and clean up their names.
      this.occupationsLevel3.sort((a, b) => a.name.localeCompare(b.name));
      for (let occ of this.occupationsLevel3) {
        let name = occ.name;

        // While the name has a _, remove it (if at start) or replace it with space.
        while (true) {
          const pos = name.search('_');
          if (pos == -1) break;
          const replacement = pos == 0 ? '' : ' ';
          name = `${name.substring(0, pos)}${replacement}${name.substring(
            pos + 1
          )}`;
        }

        occ.name = name;
      }

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
        // Update advancedMode.
        values = values as FormValues;
        const newAdvancedMode = this.determineAdvancedMode(values);
        if (newAdvancedMode != values.advancedMode) {
          values.advancedMode = newAdvancedMode;
          this.form.patchValue(values, { emitEvent: false });
        }

        // Compile term from form values and emit.
        this.termChanged.emit(this.getTermFromFormValues(values));
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

  onOccupationLevel3Selected(occupation: Variable | null) {
    // Update the form value to either the new id or null.
    this.form.patchValue({ occupationLevel3Id: occupation?.id ?? null });
  }

  onFormSubmit(): void {
    const term = this.getTermFromFormValues(this.form.value);
    this.submitted.next(term);
  }

  private determineAdvancedMode(values: FormValues): boolean {
    const hasWildcard = values.name.includes('*') || values.name.includes('?');
    if (values.advancedMode && !hasWildcard) {
      // Advanced mode was turned on, either now or before.
      // It should not be turned off even if there are no wildcards.
      return true;
    } else if (values.advancedMode && hasWildcard) {
      return true;
    } else if (!values.advancedMode && !hasWildcard) {
      return false;
    } else if (!values.advancedMode && hasWildcard) {
      return true;
    }
    return false;
  }

  private getTermFromFormValues(values: FormValues): string {
    // Map values to search parameters.
    const params: SearchParameters = { ...values };
    if (values.name && !values.advancedMode) {
      params.name = `*${values.name}*`;
    }

    return this.searchService.getTermFromSearchParameters(params);
  }

  private pushTermToForm(term: string): void {
    const values: FormValues = {
      name: '',
      birthMin: null,
      birthMax: null,
      deathMin: null,
      deathMax: null,
      citizenshipId: null,
      occupationLevel1Id: null,
      occupationLevel3Id: null,
      genderId: null,
      notabilityMin: null,
      notabilityMax: null,
      wikidataCode: null,
      advancedMode: false,
    };
    const criteria = this.searchService.getSearchCriteriaFromTerm(term);

    for (let c of criteria) {
      if (c.key == 'name' && (c.operation == ':' || c.operation == '~')) {
        const name = c.value;
        if (name.startsWith('*') && name.endsWith('*')) {
          // Starts and ends with *.
          const nameTrimmed = name.substring(1, name.length - 1);
          if (nameTrimmed.includes('*') || nameTrimmed.includes('?')) {
            // Also has wildcards inside.
            values.name = name;
            values.advancedMode = true;
          } else {
            // No wildcards inside. Interpret as not advanced mode.
            values.name = nameTrimmed;
            values.advancedMode = false;
          }
        } else if (name.includes('*') || name.includes('?')) {
          // Does not start and end with *, but has wildcard somewhere.
          values.name = name;
          values.advancedMode = true;
        } else {
          // No wildcard anywhere.
          values.name = name;
          values.advancedMode = false;
        }
      } else if (c.key == 'birth') {
        let num = Number(c.value);
        if (Number.isInteger(num)) {
          num = this.personParametersService.clampLifeYear(num);
          if (c.operation == '>=') {
            values.birthMin = num;
          } else if (c.operation == '<=') {
            values.birthMax = num;
          }
        }
      } else if (c.key == 'death') {
        let num = Number(c.value);
        if (Number.isInteger(num)) {
          num = this.personParametersService.clampLifeYear(num);
          if (c.operation == '>=') {
            values.deathMin = num;
          } else if (c.operation == '<=') {
            values.deathMax = num;
          }
        }
      } else if (c.key == 'citizenship1BId' && c.operation == ':') {
        const id = Number(c.value);
        if (this.citizenships.find((item) => item.id === id)) {
          values.citizenshipId = id;
        }
      } else if (c.key == 'level1MainOccId' && c.operation == ':') {
        const id = Number(c.value);
        if (this.occupationsLevel1.find((item) => item.id === id)) {
          values.occupationLevel1Id = id;
        }
      } else if (c.key == 'level3MainOccId' && c.operation == ':') {
        const id = Number(c.value);
        const occupation = this.occupationsLevel3.find(
          (item) => item.id === id
        );
        if (occupation) {
          values.occupationLevel3Id = id;
          this.recentmostPushedOccupationLevel3 = occupation;
        }
      } else if (c.key == 'genderId' && c.operation == ':') {
        const id = Number(c.value);
        if (this.genders.find((item) => item.id === id)) {
          values.genderId = id;
        }
      } else if (c.key == 'notabilityIndex') {
        let num = Number(c.value);
        if (Number.isInteger(num)) {
          num = this.personParametersService.clampNotability(num);
          if (c.operation == '>=') {
            values.notabilityMin = num;
          } else if (c.operation == '<=') {
            values.notabilityMax = num;
          }
        }
      }
    }

    // Do not emit an event to not trigger the default behavior that happens
    // when the user changes the form.
    this.form.setValue(values, { emitEvent: false });
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
    return this.form.get('citizenshipId')!;
  }

  get occupationLevel1Field(): AbstractControl {
    return this.form.get('occupationLevel1Id')!;
  }

  get genderField(): AbstractControl {
    return this.form.get('genderId')!;
  }

  get notabilityMinField(): AbstractControl {
    return this.form.get('notabilityMin')!;
  }

  get notabilityMaxField(): AbstractControl {
    return this.form.get('notabilityMax')!;
  }
}

interface FormValues extends SearchParameters {
  advancedMode: boolean;
}
