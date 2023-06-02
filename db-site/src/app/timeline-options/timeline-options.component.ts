import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NumberRange } from '../number-range.model';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { VariablesService } from '../variables.service';
import { Variable } from '../variable.model';
import { TimelineOptions } from '../timeline-options.model';

@Component({
  selector: 'dbw-timeline-options',
  templateUrl: './timeline-options.component.html',
  styleUrls: ['./timeline-options.component.css'],
})
export class TimelineOptionsComponent implements OnInit {
  @Input() selectedYears!: NumberRange;

  form: FormGroup;

  genders: Variable[] = [];
  occupationsLevel1: Variable[] = [];
  citizenships: Variable[] = [];

  @Output() optionsChanged = new EventEmitter<TimelineOptions>();

  constructor(
    fb: NonNullableFormBuilder,
    private variablesService: VariablesService
  ) {
    this.form = fb.group({
      citizenshipId: fb.control<number | null>(null),
      occupationLevel1Id: fb.control<number | null>(null),
      genderId: fb.control<number | null>(null),
    });
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

    this.form.valueChanges.subscribe((values) => {
      if (!this.form.valid) return;
      this.optionsChanged.emit(values as TimelineOptions);
    });
  }
}
