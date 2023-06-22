import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TimelinePoint } from '../timeline-point.model';
import {
  ReplaySubject,
  concat,
  map,
  pairwise,
  startWith,
  switchMap,
  take,
  timer,
  withLatestFrom,
} from 'rxjs';
import { VariablesService } from '../variables.service';
import { TimelineDrawParams } from '../timeline-draw-params.model';

@Component({
  selector: 'dbw-timeline-canvas-painter',
  templateUrl: './timeline-canvas-painter.component.html',
  styleUrls: ['./timeline-canvas-painter.component.css'],
})
export class TimelineCanvasPainterComponent implements OnInit, OnChanges {
  @Input() drawParams!: TimelineDrawParams | null;
  @Input() buckets: TimelinePoint[][] = [];

  @ViewChild('canvas') canvasRef!: ElementRef;

  // Drawing parameters.
  readonly backupPointColors = [
    'rgb(100, 100, 100)',
    'rgb(120, 120, 120)',
    'rgb(80, 80, 80)',
  ];
  readonly numDrawingFrames = 30;
  readonly drawingDelay = (1 / 60) * 1000;

  occupationIdToColor: string[] | null = null;

  redrawCanvas$ = new ReplaySubject<void>();
  buckets$ = new ReplaySubject<TimelinePoint[][]>();
  lastDrawFrame: number = 0;

  constructor(private variablesService: VariablesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['buckets']) {
      this.buckets$.next(this.buckets);
      this.redrawCanvas$.next();
    }

    if (changes['drawParams']) {
      this.updateCanvasSize();
      this.redrawCanvas$.next();
    }
  }

  ngOnInit(): void {
    this.variablesService.getOccupationIdToColorMap().subscribe((map) => {
      this.occupationIdToColor = map;
      this.redrawCanvas$.next();
    });

    // Canvas drawing.
    const drawFramesAndBucketsPairwise = timer(0, this.drawingDelay).pipe(
      withLatestFrom(this.buckets$.pipe(startWith([]), pairwise()))
    );
    // Get observable that undraws the current canvas, even if it's being drawn.
    const getUndrawObservable = (lastDrawFrame: number) =>
      drawFramesAndBucketsPairwise.pipe(
        take(lastDrawFrame),
        // Reverse order.
        map(([frame, [prevBuckets, _]]) => [lastDrawFrame - frame, prevBuckets])
      );
    // Observable that draws the canvas from nothing.
    const draw = drawFramesAndBucketsPairwise.pipe(
      take(this.numDrawingFrames + 1),
      map(([frame, [_, buckets]]) => [frame, buckets])
    );

    this.redrawCanvas$
      .pipe(
        // First undraw, then draw.
        switchMap(() => concat(getUndrawObservable(this.lastDrawFrame), draw))
      )
      .subscribe((data) => {
        const [frame, buckets] = data as [number, TimelinePoint[][]];
        this.lastDrawFrame = frame;
        this.drawCanvas(buckets, frame / this.numDrawingFrames);
      });
  }

  /**
   * Resize canvas element (its height and width properties)
   * to fit its actual actual screen size.
   */
  updateCanvasSize(): void {
    if (!this.canvasRef || !this.drawParams) return;

    const canvasElement = this.canvasRef.nativeElement;
    canvasElement.width = this.drawParams.drawAreaSize.x;
    canvasElement.height = this.drawParams.drawAreaSize.y;
  }

  /**
   * Draw the points in the buckets onto the canvas.
   * @param buckets The buckets to draw.
   * @param progress A number between 0 and 1.
   * What point of the drawing animation to draw. 0 is beginning, 1 is end.
   */
  drawCanvas(buckets: TimelinePoint[][], progress: number): void {
    if (!this.drawParams) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');

    // White background.
    ctx.fillStyle = 'white';
    ctx.fillRect(
      0,
      0,
      this.drawParams.drawAreaSize.x,
      this.drawParams.drawAreaSize.y
    );

    // Draw all buckets.
    // Index 0 will be in the middle, 1 above 0, 2 below 0, 3 below 1, etc.
    const occupationIdToColor = this.occupationIdToColor;
    const backupPointColors = this.backupPointColors;

    const pointSize = this.drawParams.pointSize;
    const pointMarginSizeCombined = pointSize + this.drawParams.marginSize;
    let x = this.drawParams.marginSize;

    for (const bucket of buckets) {
      // Y coordinate of top point will be a point and margin size away
      // from the middle line.
      let yTop =
        this.drawParams.drawAreaMiddlePosition.y - pointMarginSizeCombined;
      // Y coordinate of bottom point will be directly at the bottom line.
      let yBottom = this.drawParams.drawAreaMiddlePosition.y;

      // Alternately place points at bottom/top positions and move
      // down/up, starting with the bottom position.
      for (
        let pointIndex = 0;
        pointIndex < Math.ceil(bucket.length * progress);
        pointIndex++
      ) {
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
