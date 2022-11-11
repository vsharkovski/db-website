import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'dbw-search-options',
  templateUrl: './search-options.component.html',
  styleUrls: ['./search-options.component.css'],
})
export class SearchOptionsComponent implements OnInit {
  form = this.formBuilder.group({
    term: '',
    page: 0,
  });

  @Output() pageChanged = new EventEmitter<number>();
  @Output() termChanged = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form.valueChanges.subscribe((values) => {
      this.termChanged.emit(values.term ?? '');
      this.pageChanged.emit(values.page ?? 0);
    });
  }

  onSubmit(): void {
    this.submitted.emit();
  }
}
