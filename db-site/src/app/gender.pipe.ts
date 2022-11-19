import { Pipe, PipeTransform } from '@angular/core';

const genderMap = new Map<string | undefined | null, string>([
  ['Male', 'Male'],
  ['Female', 'Female'],
  ['Other', '~'],
]);

@Pipe({
  name: 'gender',
})
export class GenderPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    return genderMap.get(value) ?? '~';
  }
}
