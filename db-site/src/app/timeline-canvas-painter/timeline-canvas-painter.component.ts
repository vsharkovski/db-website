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
  filter,
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
  @Input() buckets!: TimelinePoint[][];

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
  drawParams$ = new ReplaySubject<TimelineDrawParams | null>();
  buckets$ = new ReplaySubject<TimelinePoint[][]>();
  lastDrawFrame: number = 0;

  constructor(private variablesService: VariablesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['buckets']) {
      this.buckets$.next(this.buckets);
      this.redrawCanvas$.next();
    }

    if (changes['drawParams']) {
      this.drawParams$.next(this.drawParams);
      this.redrawCanvas$.next();
      this.updateCanvasSize();
    }
  }

  ngOnInit(): void {
    // Colors.
    this.variablesService.getOccupationIdToColorMap().subscribe((map) => {
      this.occupationIdToColor = map;
      // Redraw canvas with colors.
      this.redrawCanvas$.next();
    });

    // Canvas drawing.
    const drawFrameData$ = timer(0, this.drawingDelay).pipe(
      withLatestFrom(this.drawParams$.pipe(startWith(null), pairwise())),
      withLatestFrom(this.buckets$.pipe(startWith([]), pairwise())),
      map(
        ([[frame, [prevParams, currParams]], [prevBuckets, currBuckets]]) => ({
          frame,
          prevParams,
          currParams,
          prevBuckets,
          currBuckets,
        })
      )
    );
    // Get observable that undraws the current canvas, even if it's being drawn.
    const getUndrawObservable = (lastDrawFrame: number) =>
      drawFrameData$.pipe(
        take(lastDrawFrame),
        // Reverse order.
        map((data) => ({
          frame: lastDrawFrame - data.frame,
          buckets: data.prevBuckets,
          params: data.prevParams,
        }))
      );
    // Observable that draws the canvas from nothing.
    const draw = drawFrameData$.pipe(
      take(this.numDrawingFrames + 1),
      map((data) => ({
        frame: data.frame,
        buckets: data.currBuckets,
        params: data.currParams,
      }))
    );

    this.redrawCanvas$
      .pipe(
        // First undraw, then draw.
        switchMap(() => concat(getUndrawObservable(this.lastDrawFrame), draw)),
        // Need drawParams to draw.
        filter((data) => data.params !== null)
      )
      .subscribe(({ frame, buckets, params }) => {
        this.lastDrawFrame = frame;
        this.drawCanvas(params!, buckets, frame / this.numDrawingFrames);
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
  drawCanvas(
    drawParams: TimelineDrawParams,
    buckets: TimelinePoint[][],
    progress: number
  ): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d');

    // White background.
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawParams.drawAreaSize.x, drawParams.drawAreaSize.y);

    // Draw all buckets.
    // Index 0 will be in the middle, 1 above 0, 2 below 0, 3 below 1, etc.
    const occupationIdToColor = this.occupationIdToColor;
    const backupPointColors = this.backupPointColors;

    const pointSize = drawParams.pointSize;
    const pointMarginSizeCombined = pointSize + drawParams.marginSize;
    let x = drawParams.marginSize;

    for (const bucket of buckets) {
      // Y coordinate of top point will be a point and margin size away
      // from the middle line.
      let yTop = drawParams.drawAreaMiddlePosition.y - pointMarginSizeCombined;
      // Y coordinate of bottom point will be directly at the bottom line.
      let yBottom = drawParams.drawAreaMiddlePosition.y;

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
