import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  readonly LIFE_YEAR_MIN = -3500;
  readonly LIFE_YEAR_MAX = 2020;

  clampLifeYear(year: number): number {
    return Math.min(Math.max(year, this.LIFE_YEAR_MIN), this.LIFE_YEAR_MAX);
  }

  clampNotability(notability: number): number {
    return Math.min(Math.max(notability, 0), 100);
  }
}
