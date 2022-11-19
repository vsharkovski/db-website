import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unknown',
})
export class UnknownPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (value === undefined || value === null || value == '' || value == '~') {
      return 'unknown/missing';
    }
    return value;
  }
}
