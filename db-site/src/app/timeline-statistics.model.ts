import { NumberRange } from "./number-range.model";

export interface TimelineTimeStatistics {
  numPointsAtMoment: number[];
  timeBoundaries: NumberRange;
}
