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
   * @param rounding -1 (floor), 0 (round), or 1 (ceil)
   * @returns Math.floor, Math.round, or Math.ceil.
   * If rounding is not -1, 0, or 1, returns Math.ceil.
   */
  getRoundingFn(rounding: number): (x: number) => number {
    return rounding === 0
      ? Math.round
      : rounding === -1
      ? Math.floor
      : Math.ceil;
  }

  /**
   * Linearly map a fraction to a range of discrete values.
   * @param fraction A number in range [0, 1).
   * @param valueBoundary Discrete value range [min, max].
   * @param rounding -1 (floor), 0 (round), or 1 (ceil).
   */
  mapFractionToValueLinear(
    fraction: number,
    valueBoundary: NumberRange,
    rounding: number
  ): number {
    const v =
      valueBoundary.min +
      fraction * (valueBoundary.max - valueBoundary.min + 1);
    return this.clamp(this.getRoundingFn(rounding)(v), valueBoundary);
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
   * @param rounding -1 (floor), 0 (round), or 1 (ceil).
   */
  mapFractionToValueLog(
    fraction: number,
    valueBoundary: NumberRange,
    rounding: number
  ): number {
    /*
    Formula is v=(1/k)*ln((e^kb-e^ka)f + e^ka), where
    a=valueBoundary.min, b=valueBoundary.max+1, k is a constant.
    We can't calculate this using floating-point arithmetic, but
    because a << -100 in all our use cases, we have an approximation
    f~b+ln(x)/k.
    */
    const v =
      valueBoundary.max + 1 + Math.log(fraction) / this.logarithmicConstant;
    return this.clamp(this.getRoundingFn(rounding)(v), valueBoundary);
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
   * @param rounding -1 (floor), 0 (round), or 1 (ceil).
   */
  mapFractionToValue(
    mappingType: RangeMappingType,
    fraction: number,
    valueBoundary: NumberRange,
    rounding: number
  ): number {
    if (mappingType === 'linear') {
      return this.mapFractionToValueLinear(fraction, valueBoundary, rounding);
    } else {
      // Log.
      return this.mapFractionToValueLog(fraction, valueBoundary, rounding);
    }
  }

  /**
   * See mapValueToFraction.
   */
  mapValueRangeToFractionRange(
    mappingType: RangeMappingType,
    valueRange: NumberRange,
    valueBoundary: NumberRange
  ): NumberRange {
    return {
      min: this.mapValueToFraction(mappingType, valueRange.min, valueBoundary),
      max: this.mapValueToFraction(mappingType, valueRange.max, valueBoundary),
    };
  }

  /**
   * See mapFractionToValue.
   * @param roundingMin Rounding for range minimum.
   * @param roundingMax Rounding for range maximum.
   */
  mapFractionRangeToValueRange(
    mappingType: RangeMappingType,
    fractionRange: NumberRange,
    valueBoundary: NumberRange,
    roundingMin: number,
    roundingMax: number
  ): NumberRange {
    return {
      min: this.mapFractionToValue(
        mappingType,
        fractionRange.min,
        valueBoundary,
        roundingMin
      ),
      max: this.mapFractionToValue(
        mappingType,
        fractionRange.max,
        valueBoundary,
        roundingMax
      ),
    };
  }

  /**
   * Shift a value range by a fractional difference.
   * @param mappingType Linear or log.
   * @param valueRange The range to shift.
   * @param valueBoundary The boundary of the range.
   * @param fractionDifference The fraction of the boundary to shift by.
   * @param forceChange Whether to force a change of at least 1, even if
   * fractionDifference is too small to map a value difference of 1.
   * @returns The resulting value range.
   */
  shiftValueRangeByFractionDifference(
    mappingType: RangeMappingType,
    valueRange: NumberRange,
    valueBoundary: NumberRange,
    fractionDifference: number,
    forceChange: boolean
  ): NumberRange {
    const fractionRange = this.mapValueRangeToFractionRange(
      mappingType,
      valueRange,
      valueBoundary
    );
    const newFractionRange: NumberRange = {
      min: this.clampFraction(fractionRange.min + fractionDifference),
      max: this.clampFraction(fractionRange.max + fractionDifference),
    };
    const newValueRange = this.mapFractionRangeToValueRange(
      mappingType,
      newFractionRange,
      valueBoundary,
      0,
      0
    );

    if (
      forceChange &&
      newValueRange.min === valueRange.min &&
      newValueRange.max === valueRange.max
    ) {
      const sign = Math.sign(fractionDifference);
      newValueRange.min = this.clamp(newValueRange.min + sign, valueBoundary);
      newValueRange.max = this.clamp(newValueRange.max + sign, valueBoundary);
    }

    return newValueRange;
  }

  shiftFractionRangeByFractionDifference(
    fractionRange: NumberRange,
    fractionDifference: number
  ): NumberRange {
    return {
      min: this.clampFraction(fractionRange.min + fractionDifference),
      max: this.clampFraction(fractionRange.max + fractionDifference),
    };
  }

  roundFraction(
    type: RangeMappingType,
    fraction: number,
    valueBoundary: NumberRange,
    rounding: number
  ): number {
    const value = this.mapFractionToValue(
      type,
      fraction,
      valueBoundary,
      rounding
    );
    return this.mapValueToFraction(type, value, valueBoundary);
  }

  roundFractionRange(
    type: RangeMappingType,
    fractionRange: NumberRange,
    valueBoundary: NumberRange,
    roundingMin: number,
    roundingMax: number
  ) {
    const valueRange = this.mapFractionRangeToValueRange(
      type,
      fractionRange,
      valueBoundary,
      roundingMin,
      roundingMax
    );
    return this.mapValueRangeToFractionRange(type, valueRange, valueBoundary);
  }
}
