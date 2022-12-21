import { Pipe, PipeTransform } from '@angular/core';
import { SortState } from './sort-state.model';

@Pipe({
  name: 'sortDirection',
})
export class SortDirectionPipe implements PipeTransform {
  transform(value: SortState['direction'] | null): string {
    if (value === 'ascending') {
      return '▲';
    } else if (value === 'descending') {
      return '▼';
    } else {
      return '-';
    }
  }
}
