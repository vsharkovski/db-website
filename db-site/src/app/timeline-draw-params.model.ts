import { PixelPair } from './pixel-pair.model';

export interface TimelineDrawParams {
  drawAreaSize: PixelPair;
  drawAreaMiddlePosition: PixelPair;
  // Sizes are in pixels.
  pointSize: number;
  marginSize: number;
  numBuckets: number;
}
