import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TimelinePoint } from '../timeline-point.model';
import { ReplaySubject, debounceTime } from 'rxjs';
import { TimelineCanvasPainterService } from '../timeline-canvas-painter.service';
import { VariablesService } from '../variables.service';

@Component({
  selector: 'dbw-timeline-canvas-painter',
  templateUrl: './timeline-canvas-painter.component.html',
  styleUrls: ['./timeline-canvas-painter.component.css'],
})
export class TimelineCanvasPainterComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() dataSelected: TimelinePoint[] = [];
  @Input() maxSelectedDataPointsAtAnyMoment: number | null = null;
  @Input() buckets: TimelinePoint[][] = [];

  @Output() numBucketsUpdated = new EventEmitter<number>();

  @ViewChild('canvas') canvasRef?: ElementRef;

  initialize$ = new ReplaySubject<void>();

  // Drawing parameters.
  readonly minPointSizePixels = 5;
  readonly maxPointSizePixels = 44;
  readonly pointMarginFractionOfSize = 0.25;
  readonly backupPointColors = [
    'rgb(100, 100, 100)',
    'rgb(120, 120, 120)',
    'rgb(80, 80, 80)',
  ];

  canvasBoundingBox?: DOMRect;
  canvasMiddleYPixels = 0;
  pointSizePixels = 4;
  marginSizePixels = 2;
  pointMarginSizeCombined = 6;

  occupationIdToColor: string[] | null = null;

  constructor(
    private service: TimelineCanvasPainterService,
    private variablesService: VariablesService
  ) {}

  ngOnInit(): void {
    this.variablesService.getOccupationIdToColorMap().subscribe((map) => {
      this.occupationIdToColor = map;

      // Re-draw canvas immediately with colors.
      this.updateCanvasSize();
      this.updateDrawData();
      this.drawCanvas();
    });

    this.initialize$.pipe(debounceTime(100)).subscribe(() => {
      this.updateCanvasSize();
      this.updateDrawData();
      this.updateNumBuckets();
      // Draw the canvas even though the buckets are outdated and will
      // soon be updated to new ones.
      // This prevents a blank screen.
      this.drawCanvas();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dataSelected'] ||
      changes['maxSelectedDataPointsAtAnyMoment']
    ) {
      this.initialize$.next();
    }
    if (changes['buckets']) {
      this.service.numBuckets = this.buckets.length;
      this.updateCanvasSize();
      this.updateDrawData();
      this.drawCanvas();
    }
  }

  ngAfterViewInit(): void {
    this.initialize$.next();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.initialize$.next();
  }

  /**
   * Resize canvas element (its height and width properties)
   * to fit its actual actual screen size.
   * Update canvasBoundingBox with new dimensions.
   * @returns Whether the canvas was resized (changed dimensions).
   */
  updateCanvasSize(): boolean {
    if (!this.canvasRef) return false;

    const canvasElement = this.canvasRef.nativeElement;
    this.canvasBoundingBox = canvasElement.getBoundingClientRect();
    this.service.canvasBoundingBox = this.canvasBoundingBox;

    const didResize =
      canvasElement.height != this.canvasBoundingBox!.height ||
      canvasElement.width != this.canvasBoundingBox!.width;

    canvasElement.height = this.canvasBoundingBox!.height;
    canvasElement.width = this.canvasBoundingBox!.width;

    return didResize;
  }

  /**
   * Update data used for drawing on the canvas and for calculating
   * the number of buckets:
   * canvasMiddleYPixels, pointSize, marginSize.
   * @returns Whether the data was updated.
   */
  updateDrawData(): boolean {
    if (!this.canvasBoundingBox) return false;

    this.canvasMiddleYPixels = Math.round(this.canvasBoundingBox.height / 2);
    this.service.canvasMiddleYPixels = this.canvasMiddleYPixels;

    // Determine biggest point pixel size that would not make any bucket (column)
    // exceed the height of the canvas if drawn later.
    // We are assuming pointMargin will be a fraction of pointSize in order to
    // simplify calculations and approximate a good number with math.
    const numSelected = Math.max(1, this.dataSelected.length);
    const maxAtAny = Math.max(1, this.maxSelectedDataPointsAtAnyMoment ?? 1);

    const pointSizeRaw = Math.sqrt(
      (this.canvasBoundingBox.height * this.canvasBoundingBox.width) /
        numSelected /
        maxAtAny ** (1 / 8) /
        (1 + this.pointMarginFractionOfSize) ** 2
    );
    const pointSizePixelsUnrestricted = Math.floor(pointSizeRaw);
    this.pointSizePixels = Math.max(
      this.minPointSizePixels,
      Math.min(this.maxPointSizePixels, pointSizePixelsUnrestricted)
    );

    // Make the margin be a fraction of the size of the point.
    this.marginSizePixels = Math.floor(
      this.pointSizePixels * this.pointMarginFractionOfSize
    );
    this.service.marginSizePixels = this.marginSizePixels;

    this.pointMarginSizeCombined = this.pointSizePixels + this.marginSizePixels;
    this.service.pointMarginSizeCombined = this.pointMarginSizeCombined;

    return true;
  }

  /**
   * Emit new number of buckets, together with the dataSelected to which
   * the number corresponds to.
   */
  updateNumBuckets(): void {
    if (!this.canvasBoundingBox) return;

    const numBuckets = Math.max(
      1,
      Math.floor(this.canvasBoundingBox.width / this.pointMarginSizeCombined)
    );
    this.numBucketsUpdated.emit(numBuckets);
  }

  /**
   * Draw the points in the buckets onto the canvas.
   */
  drawCanvas(): void {
    if (!this.canvasRef || !this.canvasBoundingBox) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');

    // Draw white background.
    // ctx.fillStyle = 'white';
    // ctx.fillRect(
    //   0,
    //   0,
    //   this.canvasBoundingBox.width,
    //   this.canvasBoundingBox.height
    // );

    // Draw all buckets.
    // Index 0 will be in the middle, 1 above 0, 2 below 0, 3 below 1, etc.
    const pointSize = this.pointSizePixels;
    const pointMarginSizeCombined = this.pointMarginSizeCombined;
    const yMiddle = this.canvasMiddleYPixels;
    const occupationIdToColor = this.occupationIdToColor;
    const backupPointColors = this.backupPointColors;

    let x = this.marginSizePixels;

    for (const bucket of this.buckets) {
      // Y coordinate of top point will be a point and margin size away
      // from the middle line.
      let yTop = yMiddle - pointMarginSizeCombined;
      // Y coordinate of bottom point will be directly at the bottom line.
      let yBottom = yMiddle;

      // Alternately place points at bottom/top positions and move
      // down/up, starting with the bottom position.
      for (let pointIndex = 0; pointIndex < bucket.length; pointIndex++) {
        // Pick random color for this point.
        if (occupationIdToColor) {
          ctx.fillStyle =
            occupationIdToColor[bucket[pointIndex].level1MainOccId ?? 0];
        } else {
          ctx.fillStyle =
            backupPointColors[
              Math.floor(Math.random() * backupPointColors.length)
            ];
        }

        if (pointIndex % 2 == 0) {
          ctx.fillRect(x, yBottom, pointSize, pointSize);
          yBottom += pointMarginSizeCombined;
        } else {
          ctx.fillRect(x, yTop, pointSize, pointSize);
          yTop -= pointMarginSizeCombined;
        }
      }

      x += pointMarginSizeCombined;
    }
  }
}
