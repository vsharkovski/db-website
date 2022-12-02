import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'readableName',
})
export class ReadableNamePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    return value?.replace(new RegExp('_', 'g'), ' ') ?? '';
  }
}
