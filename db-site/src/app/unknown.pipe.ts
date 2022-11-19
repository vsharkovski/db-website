import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unknown',
})
export class UnknownPipe implements PipeTransform {
  transform(
    value: string | undefined | null,
    useUnknownOrMissing = true,
    useNotDead = false
  ): string {
    if (value === undefined || value === null || value == '' || value == '~') {
      if (useUnknownOrMissing && useNotDead) {
        return 'not dead / unknown';
      } else if (useUnknownOrMissing) {
        return 'unknown';
      } else if (useNotDead) {
        return 'not dead';
      } else {
        return '~';
      }
    }
    return value;
  }
}
