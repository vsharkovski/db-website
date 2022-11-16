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
import { SearchQuery } from '../search-query.model';

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

  @Output() queryChanged = new EventEmitter<SearchQuery>();
  @Output() submitted = new EventEmitter<void>();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    // set initial options
    this.pushQueryToOptions({ page: this.initialPage, term: this.initialTerm });
    // when things are changed, send signal up
    this.form.valueChanges.subscribe((values) => {
      this.queryChanged.emit({
        term: values['term'] ?? '',
        page: values['page'] ?? 0,
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}

  pushQueryToOptions(query: SearchQuery): void {
    this.form.get('page')!.setValue(query.page);
    this.form.get('term')!.setValue(query.term);
  }

  pullQueryFromOptions(): SearchQuery {
    return { page: 0, term: '' };
  }
}
