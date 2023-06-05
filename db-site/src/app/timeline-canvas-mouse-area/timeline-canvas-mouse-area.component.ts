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
  map,
  of,
  switchMap,
} from 'rxjs';
import { PersonService } from '../person.service';
import { WikiService } from '../wiki.service';
import { ModalService } from '../modal.service';
import { WikiApiPage } from '../wiki-api-page.model';
import { Person } from '../person.model';
import { PixelCoordinate } from '../pixel-coordinate.model';
import { TimelineCanvasPainterService } from '../timeline-canvas-painter.service';

interface PointData {
  point: TimelinePoint | null;
  person: Person | null;
  wikiPage: WikiApiPage | null;
  position: PixelCoordinate | null;
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

  @Input() buckets!: TimelinePoint[][];
  @Input() mousePosition!: PixelCoordinate | null;
  @Input() lastValidMousePosition!: PixelCoordinate | null;

  hovered: PointData = {
    point: null,
    person: null,
    wikiPage: null,
    position: null,
  };
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();
  updateHoverApiData$ = new Subject<TimelinePoint>();

  highlighted: PointData[] = [];
  highlightedPoints$ = new Subject<TimelinePoint[]>();

  constructor(
    private painterService: TimelineCanvasPainterService,
    private personService: PersonService,
    private wikiService: WikiService,
    private modalService: ModalService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mousePosition) {
      // For all changes, we should update hover data.
      this.updateHoverData(this.mousePosition);
    }

    if (changes['buckets']) {
      // New bucket data. Update highlighted points.
      const highlightedPointsAndIndices = this.pickHighlightedPoints(
        this.buckets,
        this.maxNumHighlightedPoints
      );
      this.highlighted = highlightedPointsAndIndices.map((it) => ({
        point: it.point,
        person: null,
        wikiPage: null,
        position: this.painterService.getPixelFromGridPosition({
          // We're assuming the points with highest notability will be at
          // row 0 (the vertical middle).
          row: 0,
          col: it.index,
        }),
      }));
      // Send signal that highlighted points were changed.
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
  }

  @HostListener('window:click')
  onPointerClick(): void {
    if (this.hovered.person) {
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
  updateHoverData(pixel: PixelCoordinate): void {
    // Update hovered point and related properties.
    const hovered = this.getBestPointAroundPixel(pixel, this.hoverRadiusPixels);
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

  getBestPointAroundPixel(
    pixel: PixelCoordinate,
    distancePixels: number
  ): TimelinePoint | null {
    const center = this.painterService.getApproxGridPositionFromPixel(pixel);
    if (center === null) return null;

    const maxDist = Math.max(
      0,
      this.painterService.getApproxGridDistanceFromPixelDistance(
        distancePixels
      ) - 1
    );

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
    maxCount: number
  ): PointAndIndex[] {
    if (maxCount == 0) return [];

    // Sort data by notabilityIndex descending.
    const data: PointAndIndex[] = buckets
      .flatMap((bucket, index) =>
        bucket.map((point) => ({ point: point, index: index }))
      )
      .sort((a, b) => b.point.notabilityIndex - a.point.notabilityIndex);

    const minAllowedDistance = Math.floor(buckets.length / maxCount);

    // Keep adding points to result, up to maxCount.
    // Only add a point if it is far enough away from any other.
    const result: PointAndIndex[] = [];

    for (const point of data) {
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
}
