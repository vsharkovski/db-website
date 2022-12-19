import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortDirection',
})
export class SortDirectionPipe implements PipeTransform {
  transform(value: string | null): string {
    if (value === 'ascending') {
      return '^';
    } else if (value === 'descending') {
      return 'v';
    } else {
      return '-';
    }
  }
}
