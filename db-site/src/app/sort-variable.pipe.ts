import { Pipe, PipeTransform } from '@angular/core';
import { SortState } from './sort-state.model';

@Pipe({
  name: 'sortVariable',
})
export class SortVariablePipe implements PipeTransform {
  transform(value: SortState['variable']): string {
    if (value === 'notabilityIndex') {
      return 'notability index';
    } else if (value === 'birth') {
      return 'birth year';
    } else if (value === 'death') {
      return 'death year';
    } else {
      return '';
    }
  }
}
