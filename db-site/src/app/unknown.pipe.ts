import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unknown',
})
export class UnknownPipe implements PipeTransform {
  transform(
    value: string | undefined | null,
    useUnknownOrMissing = true,
    useNotDead = true
  ): string {
    if (value === undefined || value === null || value == '' || value == '~') {
      if (useUnknownOrMissing && useNotDead) {
        return 'not dead / unknown / missing';
      } else if (useUnknownOrMissing) {
        return 'unknown / missing';
      } else if (useNotDead) {
        return 'not dead';
      } else {
        return '~';
      }
    }
    return value;
  }
}
