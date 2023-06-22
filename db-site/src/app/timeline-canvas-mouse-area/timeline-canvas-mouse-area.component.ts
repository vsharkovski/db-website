import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { TimelinePoint } from '../timeline-point.model';
import {
  Subject,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { PersonService } from '../person.service';
import { WikiService } from '../wiki.service';
import { ModalService } from '../modal.service';
import { WikiApiPage } from '../wiki-api-page.model';
import { Person } from '../person.model';
import { PixelPair } from '../pixel-pair.model';
import { TimelineDrawParams } from '../timeline-draw-params.model';
import { TimelineDrawService } from '../timeline-draw.service';

interface PointData {
  point: TimelinePoint | null;
  person: Person | null;
  wikiPage: WikiApiPage | null;
  position: PixelPair | null;
}

interface PointAndIndex {
  point: TimelinePoint;
  index: number;
}

@Component({
  selector: 'dbw-timeline-canvas-mouse-area',
  templateUrl: './timeline-canvas-mouse-area.component.html',
  styleUrls: ['./timeline-canvas-mouse-area.component.css'],
})
export class TimelineCanvasMouseAreaComponent implements OnInit, OnChanges {
  readonly hoverRadiusPixels = 16;
  readonly hoverPointerVisibileTimeAfterUpdateMs = 500;

  readonly maxNumHighlightedPoints = 4;
  readonly maxCardSizeFraction = 1 / (this.maxNumHighlightedPoints + 1);

  @Input() buckets!: TimelinePoint[][];
  @Input() drawParams!: TimelineDrawParams | null;
  @Input() mousePosition!: PixelPair | null;
  @Input() lastInsideMousePosition!: PixelPair | null;

  hovered: PointData = {
    point: null,
    person: null,
    wikiPage: null,
    position: null,
  };
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();
  updateHoverApiData$ = new Subject<TimelinePoint>();

  hoveredCardDimensions: PixelPair = { x: 0, y: 0 };
  hoveredCardPosition: PixelPair | null = null;
  updateHoveredCardPosition$ = new Subject<void>();

  highlighted: PointData[] = [];
  highlightedPoints$ = new Subject<TimelinePoint[]>();

  constructor(
    private personService: PersonService,
    private wikiService: WikiService,
    private modalService: ModalService,
    private timelineDrawService: TimelineDrawService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.mousePosition &&
      this.mousePosition === this.lastInsideMousePosition
    ) {
      // Since mouse is inside, for any change, we should update hover data.
      this.updateHoverData(this.lastInsideMousePosition);
      this.updateHoveredCardPosition$.next();
    }

    if (changes['buckets']) {
      // New bucket data. Update highlighted points.
      const highlightedPointsAndIndices = this.pickHighlightedPoints(
        this.buckets,
        this.maxNumHighlightedPoints,
        this.maxCardSizeFraction
      );
      this.highlighted = highlightedPointsAndIndices.map((it) => ({
        point: it.point,
        person: null,
        wikiPage: null,
        position: this.drawParams
          ? this.timelineDrawService.getPixelPositionFromGridPosition(
              {
                // We're assuming the points with highest notability will be at
                // row 0 (the vertical middle).
                row: 0,
                col: it.index,
              },
              this.drawParams
            )
          : null,
      }));
      this.highlightedPoints$.next(
        highlightedPointsAndIndices.map((it) => it.point)
      );
    }
  }

  ngOnInit(): void {
    /*
    Every time no hover point is selected when the mouse is moved, we request
    that the current hovered point is removed.
    Delay these requests for the hover pointer visibility time.
    Then, if the request was created after the last time the hovered point
    was updated to something not null, process it (unhover).
    */
    this.removeHoveredPoint$
      .pipe(
        delay(this.hoverPointerVisibileTimeAfterUpdateMs),
        filter((time) => time > this.hoveredPointLastTimeNotNullMs)
      )
      .subscribe(() => {
        this.hovered = {
          point: null,
          person: null,
          wikiPage: null,
          position: null,
        };
      });

    this.updateHoverApiData$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(
          (point) => point.wikidataCode == this.hovered.point?.wikidataCode
        ),
        switchMap((point) =>
          this.personService.getPersonByWikidataCode(point.wikidataCode)
        ),
        filter(
          (person) =>
            person !== null &&
            person.wikidataCode === this.hovered.point?.wikidataCode
        ),
        switchMap((person) =>
          forkJoin([
            of(person),
            this.wikiService.getDataFromEnglishWiki(person!, 300),
          ])
        )
      )
      .subscribe(([person, wikiPage]) => {
        if (!this.hovered.point) return;
        const code = this.hovered.point.wikidataCode;
        if (code === person!.wikidataCode) {
          this.hovered.person = person;
        }
        if (code === wikiPage?.wikidataCode) {
          this.hovered.wikiPage = wikiPage;
        }
      });

    // When highlighted points are changed, get their People from
    // the API. We use switchMap to cancel any ongoing request,
    // as its value will be useless.
    this.highlightedPoints$
      .pipe(
        debounceTime(100),
        switchMap((points) =>
          this.personService.getPeopleByWikidataCodes(
            points.map((point) => point.wikidataCode)
          )
        ),
        filter((persons) => persons !== null)
      )
      .subscribe((persons) => {
        // Add each person to their highlight.
        for (const highlight of this.highlighted) {
          const person = persons!.find(
            (it) => it.wikidataCode == highlight.point!.wikidataCode
          );
          if (person) highlight.person = person;
        }
      });

    this.updateHoveredCardPosition$.pipe(debounceTime(10)).subscribe(() => {
      if (!this.lastInsideMousePosition || !this.drawParams) {
        this.hoveredCardPosition = null;
        return;
      }

      this.hoveredCardPosition = this.fitRectWithinBounds(
        this.lastInsideMousePosition,
        this.hoveredCardDimensions,
        this.drawParams.drawAreaSize
      );
    });
  }

  @HostListener('window:click')
  onPointerClick(): void {
    // If modal is not opened, and a person is hovered,
    // and mouse is inside the canvas, then open a modal.
    if (
      !this.modalService.isPersonDetailModalOpen &&
      this.hovered.person &&
      this.mousePosition &&
      this.mousePosition === this.lastInsideMousePosition
    ) {
      this.modalService.openPersonDetailModal(this.hovered.person);
      this.hovered = {
        point: null,
        person: null,
        wikiPage: null,
        position: null,
      };
    }
  }

  /**
   * Update hover data from a given position.
   */
  updateHoverData(pixel: PixelPair): void {
    // Update hovered point and related properties.
    const hovered = this.getBestPointAroundPosition(
      pixel,
      this.hoverRadiusPixels
    );
    const time = new Date().getTime();

    if (hovered == null) {
      // Request to remove the hovered point.
      this.removeHoveredPoint$.next(time);
    } else {
      if (hovered != this.hovered.point) {
        this.hovered = {
          point: hovered,
          person: null,
          wikiPage: null,
          position: null,
        };
        this.updateHoverApiData$.next(hovered);
      }
      this.hoveredPointLastTimeNotNullMs = time;
    }
  }

  getBestPointAroundPosition(
    position: PixelPair,
    distancePixels: number
  ): TimelinePoint | null {
    if (!this.drawParams) return null;

    const center =
      this.timelineDrawService.getApproxGridPositionFromPixelPosition(
        position,
        this.drawParams
      );
    if (center === null) return null;

    const maxApproxGridDistance = Math.ceil(
      distancePixels / (this.drawParams.pointSize + this.drawParams.marginSize)
    );
    const maxDist = Math.max(0, maxApproxGridDistance - 1);

    // Look at cells in diamond shape around center (square rotated 45 degrees).
    let bestPoint: TimelinePoint | null = null;

    for (let deltaCol = -maxDist; deltaCol <= maxDist; deltaCol++) {
      const col = center.col + deltaCol;
      if (col < 0 || col >= this.buckets.length) continue;

      const bucket = this.buckets[col];
      const maxRowDist = maxDist - Math.abs(deltaCol);

      for (let deltaRow = -maxRowDist; deltaRow <= maxRowDist; deltaRow++) {
        const row = center.row + deltaRow;
        const index = row >= 0 ? 2 * row : 2 * -row - 1;

        if (
          index >= 0 &&
          index < bucket.length &&
          (bestPoint == null ||
            bestPoint!.notabilityIndex! < bucket[index].notabilityIndex!)
        ) {
          bestPoint = bucket[index];
        }
      }
    }

    return bestPoint;
  }

  pickHighlightedPoints(
    buckets: TimelinePoint[][],
    maxCount: number,
    maxCardSizeFraction: number
  ): PointAndIndex[] {
    if (maxCount == 0) return [];

    // Sort data by notabilityIndex descending.
    const data: PointAndIndex[] = buckets
      .flatMap((bucket, index) =>
        bucket.map((point) => ({ point: point, index: index }))
      )
      .sort((a, b) => b.point.notabilityIndex - a.point.notabilityIndex);

    const minAllowedDistance = Math.floor(buckets.length * maxCardSizeFraction);
    const minAllowedDistanceEnds = Math.floor(minAllowedDistance / 2);

    // Keep adding points to result, up to maxCount.
    const result: PointAndIndex[] = [];

    for (const point of data) {
      // Only add a point if it is far enough away from any other point,
      // and also far enough from the start/end.
      if (
        point.index < minAllowedDistanceEnds ||
        buckets.length - point.index < minAllowedDistanceEnds
      )
        continue;

      let isFarEnough = true;
      for (const added of result) {
        if (Math.abs(added.index - point.index) < minAllowedDistance) {
          isFarEnough = false;
          break;
        }
      }

      if (isFarEnough) {
        result.push(point);
        if (result.length === maxCount) break;
      }
    }

    return result;
  }

  onHoveredCardDimensionsChanged(dimensions: PixelPair): void {
    this.hoveredCardDimensions = dimensions;
    this.updateHoveredCardPosition$.next();
  }

  private fitRectWithinBounds(
    center: PixelPair,
    sizeRect: PixelPair,
    boundsRect: PixelPair
  ): PixelPair {
    const fitCoordWithinBounds = (
      coord: number,
      size: number,
      bounds: number
    ): number => {
      return (
        coord +
        Math.max(0, Math.ceil(size / 2 - coord)) -
        Math.max(0, Math.floor(coord + size / 2 - bounds))
      );
    };
    return {
      x: fitCoordWithinBounds(center.x, sizeRect.x, boundsRect.x),
      y: fitCoordWithinBounds(center.y, sizeRect.y, boundsRect.y),
    };
  }
}
