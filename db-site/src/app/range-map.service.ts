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

  clampFraction(fraction: number): number {
    return this.clamp(fraction, { min: 0, max: 1 });
  }

  /**
   * Linearly map a fraction to a range of discrete values.
   * @param fraction A number in range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   */
  mapFractionToValueLinear(
    fraction: number,
    valueBoundary: NumberRange
  ): number {
    const v =
      valueBoundary.min +
      fraction * (valueBoundary.max - valueBoundary.min + 1);
    return this.clamp(Math.round(v), valueBoundary);
  }

  /**
   * Linearly map a value to a fraction in the range [0, 1).
   * @param valueBoundary Value range [min, max].
   */
  mapValueToFractionLinear(value: number, valueBoundary: NumberRange): number {
    const f =
      (value - valueBoundary.min) / (valueBoundary.max - valueBoundary.min + 1);
    return f;
  }

  /**
   * Logarithmically map a fraction to a range of discrete values.
   * @param fraction A number in range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   */
  mapFractionToValueLog(fraction: number, valueBoundary: NumberRange): number {
    /*
    Formula is v=(1/k)*ln((e^kb-e^ka)f + e^ka), where
    a=valueBoundary.min, b=valueBoundary.max+1, k is a constant.
    We can't calculate this using floating-point arithmetic, but
    because a << -100 in all our use cases, we have an approximation
    f~b+ln(x)/k.
    */
    const v =
      valueBoundary.max + 1 + Math.log(fraction) / this.logarithmicConstant;
    return this.clamp(Math.round(v), valueBoundary);
  }

  /**
   * Logarithmically map a value to a fraction in the range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   */
  mapValueToFractionLog(value: number, valueBoundary: NumberRange): number {
    // Same logic as in getValueFromFraction, except this function is
    // the inverse of that one.
    const f = Math.exp(
      this.logarithmicConstant * (value - (valueBoundary.max + 1))
    );
    return this.clampFraction(f);
  }

  /**
   * Map a fraction to a range of discrete values.
   * @param type Linear or logarithmic.
   * @param fraction A number in range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   */
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

  /**
   * Map a fraction to a range of discrete values.
   * @param type Linear or logarithmic.
   * @param fraction A number in range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   */
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

  shiftValueRangeByFractionDifference(
    mappingType: RangeMappingType,
    valueRange: NumberRange,
    valueBoundary: NumberRange,
    fractionDifference: number
  ): NumberRange {
    const leftFraction = this.mapValueToFraction(
      mappingType,
      valueRange.min,
      valueBoundary
    );
    const rightFraction = this.mapValueToFraction(
      mappingType,
      valueRange.max,
      valueBoundary
    );

    const newLeftFraction = this.clampFraction(
      leftFraction + fractionDifference
    );
    const newRightFraction = this.clampFraction(
      rightFraction + fractionDifference
    );

    const newMinValue = this.mapFractionToValue(
      mappingType,
      newLeftFraction,
      valueBoundary
    );
    const newMaxValue = this.mapFractionToValue(
      mappingType,
      newRightFraction,
      valueBoundary
    );

    return { min: newMinValue, max: newMaxValue };
  }
}
