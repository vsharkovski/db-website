import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateYear',
})
export class DateYearPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '~';
    }
    if (value < 0) {
      return `${-value} BCE`;
    }
    return `${value} CE`;
  }
}
