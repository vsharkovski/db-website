import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit, OnChanges {
  form = this.formBuilder.group({
    term: '',
    page: 0,
  });

  @Input() initialPage: number = 0;
  @Input() initialTerm: string = '';

  @Output() queryChanged = new EventEmitter<{ page: number; term: string }>();
  @Output() submitted = new EventEmitter<void>();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    // set initial options
    this.form.get('term')!.setValue(this.initialTerm);
    this.form.get('page')!.setValue(this.initialPage);
    // when things are changed, send signal up
    this.form.valueChanges.subscribe((values) => {
      this.queryChanged.emit({
        term: values['term'] ?? '',
        page: values['page'] ?? 0,
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}
}
