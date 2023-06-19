import { Injectable } from '@angular/core';
import { NumberRange } from './number-range.model';
import { RangeMappingType } from './range-mapping.type';

@Injectable({
  providedIn: 'root',
})
export class RangeMapService {
  readonly logarithmicConstant = 0.001;

  clamp(x: number, range: NumberRange): number {
    return Math.max(range.min, Math.min(range.max, x));
  }

  /**
   * Linearly map a fraction to a range of discrete values.
   * @param fraction A number in range [0, 1).
   * @param valueRange Discrete value range [min, max].
   */
  mapFractionToValueLinear(fraction: number, valueRange: NumberRange): number {
    const v = valueRange.min + fraction * (valueRange.max - valueRange.min + 1);
    return this.clamp(Math.round(v), valueRange);
  }

  /**
   * Linearly map a value to a fraction in the range [0, 1).
   * @param valueRange Value range [min, max].
   */
  mapValueToFractionLinear(value: number, valueRange: NumberRange): number {
    const f = (value - valueRange.min) / (valueRange.max - valueRange.min + 1);
    return f;
  }

  /**
   * Logarithmically map a fraction to a range of discrete values.
   * @param fraction A number in range [0, 1).
   * @param valueRange Discrete value range [min, max].
   */
  mapFractionToValueLog(fraction: number, valueRange: NumberRange): number {
    /*
    Formula is v=(1/k)*ln((e^kb-e^ka)f + e^ka), where
    a=valueBoundary.min, b=valueBoundary.max+1, k is a constant.
    We can't calculate this using floating-point arithmetic, but
    because a << -100 in all our use cases, we have an approximation
    f~b+ln(x)/k.
    */
    const v =
      valueRange.max + 1 + Math.log(fraction) / this.logarithmicConstant;
    return this.clamp(Math.round(v), valueRange);
  }

  /**
   * Logarithmically map a value to a fraction in the range [0, 1).
   * @param valueRange Discrete value range [min, max].
   */
  mapValueToFractionLog(value: number, valueRange: NumberRange): number {
    // Same logic as in getValueFromFraction, except this function is
    // the inverse of that one.
    const f = Math.exp(
      this.logarithmicConstant * (value - (valueRange.max + 1))
    );
    return this.clamp(f, { min: 0, max: 1 });
  }

  mapValueToFraction(
    mappingType: RangeMappingType,
    value: number,
    valueBoundary: NumberRange
  ): number {
    if (mappingType === 'linear') {
      return this.mapValueToFractionLinear(value, valueBoundary);
    } else {
      // Log.
      return this.mapValueToFractionLog(value, valueBoundary);
    }
  }

  mapFractionToValue(
    mappingType: RangeMappingType,
    fraction: number,
    valueBoundary: NumberRange
  ): number {
    if (mappingType === 'linear') {
      return this.mapFractionToValueLinear(fraction, valueBoundary);
    } else {
      // Log.
      return this.mapFractionToValueLog(fraction, valueBoundary);
    }
  }
}
