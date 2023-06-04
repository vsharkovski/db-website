import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
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
import { PixelCoordinate } from '../pixel-coordinate.model';
import { TimelineCanvasPainterService } from '../timeline-canvas-painter.service';

@Component({
  selector: 'dbw-timeline-canvas-mouse-area',
  templateUrl: './timeline-canvas-mouse-area.component.html',
  styleUrls: ['./timeline-canvas-mouse-area.component.css'],
})
export class TimelineCanvasMouseAreaComponent implements OnInit, OnChanges {
  readonly hoverRadiusPixels = 16;
  readonly hoverPointerVisibileTimeAfterUpdateMs = 500;

  @Input() buckets!: TimelinePoint[][];
  @Input() mousePosition!: PixelCoordinate | null;
  @Input() lastValidMousePosition!: PixelCoordinate | null;

  hoveredPoint: TimelinePoint | null = null;
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();

  hoveredPointPerson: Person | null = null;
  hoveredPointWikiPage: WikiApiPage | null = null;
  updateHoverApiData$ = new Subject<TimelinePoint>();

  constructor(
    private painterService: TimelineCanvasPainterService,
    private personService: PersonService,
    private wikiService: WikiService,
    private modalService: ModalService
  ) {}

  ngOnChanges(): void {
    if (this.mousePosition) {
      this.updateHoverData(this.mousePosition);
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
      .subscribe((_) => {
        this.hoveredPoint = null;
        this.hoveredPointPerson = null;
        this.hoveredPointWikiPage = null;
      });

    this.updateHoverApiData$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(
          (point) => point.wikidataCode == this.hoveredPoint?.wikidataCode
        ),
        switchMap((point) =>
          this.personService.getPersonByWikidataCode(point.wikidataCode)
        ),
        filter(
          (person) =>
            person !== null &&
            person.wikidataCode === this.hoveredPoint?.wikidataCode
        ),
        switchMap((person) =>
          forkJoin([
            of(person),
            this.wikiService.getDataFromEnglishWiki(person!, 300),
          ])
        )
      )
      .subscribe(([person, wikiPage]) => {
        if (!this.hoveredPoint) return;
        const code = this.hoveredPoint.wikidataCode;
        if (code === person!.wikidataCode) {
          this.hoveredPointPerson = person;
        }
        if (code === wikiPage?.wikidataCode) {
          this.hoveredPointWikiPage = wikiPage;
        }
      });
  }

  @HostListener('window:click')
  onPointerClick(): void {
    if (this.hoveredPointPerson) {
      this.modalService.openPersonDetailModal(this.hoveredPointPerson);
      this.hoveredPoint = null;
      this.hoveredPointPerson = null;
      this.hoveredPointWikiPage = null;
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
      if (hovered != this.hoveredPoint) {
        this.hoveredPoint = hovered;
        this.hoveredPointPerson = null;
        this.hoveredPointWikiPage = null;
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
}
