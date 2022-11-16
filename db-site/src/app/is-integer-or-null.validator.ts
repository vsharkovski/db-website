import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const isIntegerOrNullValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  if (control.value !== null && !Number.isInteger(Number(control.value))) {
    return { isIntegerOrNull: true };
  }
  return null;
};
