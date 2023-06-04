import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
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

@Component({
  selector: 'dbw-timeline-canvas-mouse-area',
  templateUrl: './timeline-canvas-mouse-area.component.html',
  styleUrls: ['./timeline-canvas-mouse-area.component.css'],
})
export class TimelineCanvasMouseAreaComponent implements OnInit {
  readonly hoverRadiusPixels = 16;
  readonly hoverPointerVisibileTimeAfterUpdateMs = 500;

  @Input() buckets!: TimelinePoint[][];

  mousePositionPixels: { x: number; y: number } | null = null;
  lastValidMousePositionPixels: { x: number; y: number } | null = null;

  hoveredPoint: TimelinePoint | null = null;
  hoveredPointLastTimeNotNullMs: number = 0;
  removeHoveredPoint$ = new Subject<number>();

  hoveredPointPerson: Person | null = null;
  hoveredPointWikiPage: WikiApiPage | null = null;
  updateHoverApiData$ = new Subject<TimelinePoint>();

  constructor(
    private personService: PersonService,
    private wikiService: WikiService,
    private modalService: ModalService
  ) {}

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

  onPointerClick(): void {
    if (this.hoveredPointPerson) {
      this.modalService.openPersonDetailModal(this.hoveredPointPerson);
    }
  }

  // @HostListener('window:resize')
  // onWindowResize(): void {
  //   this.resetMouseData();
  //   this.updateMouseData();
  // }

  // @HostListener('mousemove', ['$event'])
  // onMouseMove(event: MouseEvent): void {
  //   if (!this.canvasBoundingBox) return;

  //   // Update most recent mouse position.
  //   const clamp = (x: number, min: number, max: number) =>
  //     Math.max(min, Math.min(max, x));

  //   this.mousePositionPixels = {
  //     x: clamp(
  //       Math.round(event.pageX - (this.canvasBoundingBox.x + window.scrollX)),
  //       0,
  //       this.canvasBoundingBox.width - 1
  //     ),
  //     y: clamp(
  //       Math.round(event.pageY - (this.canvasBoundingBox.y + window.scrollY)),
  //       0,
  //       this.canvasBoundingBox.height - 1
  //     ),
  //   };

  //   this.lastValidMousePositionPixels = this.mousePositionPixels;

  //   // Update mouse data.
  //   this.updateMouseData();
  // }

  // @HostListener('mouseleave')
  // onMouseLeave(): void {
  //   this.mousePositionPixels = null;
  //   this.updateMouseData();
  // }

  // resetMouseData(): void {
  //   this.mousePositionPixels = null;
  //   this.lastValidMousePositionPixels = null;
  //   this.hoveredPoint = null;
  //   this.hoveredPointPerson = null;
  //   this.hoveredPointWikiPage = null;
  // }

  // /**
  //  * Update hover data from the most recent mouse position.
  //  */
  // updateMouseData(): void {
  //   // If no mouse position, can't do anything.
  //   if (!this.mousePositionPixels) return;

  //   // Update hovered point and related properties.
  //   const hovered = this.getBestPointAroundPixel(
  //     this.mousePositionPixels.x,
  //     this.mousePositionPixels.y
  //   );
  //   const time = new Date().getTime();

  //   if (hovered == null) {
  //     // Request to remove the hovered point.
  //     this.removeHoveredPoint$.next(time);
  //   } else {
  //     if (hovered != this.hoveredPoint) {
  //       this.hoveredPoint = hovered;
  //       this.hoveredPointPerson = null;
  //       this.hoveredPointWikiPage = null;
  //       this.updateHoverApiData$.next(hovered);
  //     }
  //     this.hoveredPointLastTimeNotNullMs = time;
  //   }
  // }

  // getApproxGridPositionFromPixel(
  //   pixelX: number,
  //   pixelY: number
  // ): { row: number; col: number } | null {
  //   // Bucket index is column.
  //   // Row is counted ..., -2, -1, 0, 1, 2, ...
  //   // with 0 being first point below middle line.
  //   const bucketIndex = this.getBucketIndexFromPixel(pixelX);
  //   if (bucketIndex === null) return null;

  //   const yDistToMiddle = pixelY - this.canvasMiddleYPixels;
  //   const row =
  //     yDistToMiddle >= 0
  //       ? Math.floor(
  //           (yDistToMiddle + this.marginSizePixels) /
  //             this.pointMarginSizeCombined
  //         )
  //       : Math.floor(yDistToMiddle / this.pointMarginSizeCombined);

  //   return { col: bucketIndex, row: row };
  // }

  // getBestPointAroundPoint(centerPoint:

  // getBestPointAroundPixel(
  //   pixelX: number,
  //   pixelY: number
  // ): TimelinePoint | null {
  //   const center = this.getApproxGridPositionFromPixel(pixelX, pixelY);
  //   if (center === null) return null;

  //   const maxDist = Math.max(
  //     0,
  //     Math.ceil(this.hoverRadiusPixels / this.pointMarginSizeCombined) - 1
  //   );

  //   // Look at cells in diamond shape around center (square rotated 45 degrees).
  //   let bestPoint: TimelinePoint | null = null;

  //   for (let deltaCol = -maxDist; deltaCol <= maxDist; deltaCol++) {
  //     const col = center.col + deltaCol;
  //     if (col < 0 || col >= this.buckets.length) continue;

  //     const bucket = this.buckets[col];
  //     const maxRowDist = maxDist - Math.abs(deltaCol);

  //     for (let deltaRow = -maxRowDist; deltaRow <= maxRowDist; deltaRow++) {
  //       const row = center.row + deltaRow;
  //       const index = row >= 0 ? 2 * row : 2 * -row - 1;

  //       if (
  //         index >= 0 &&
  //         index < bucket.length &&
  //         (bestPoint == null ||
  //           bestPoint!.notabilityIndex! < bucket[index].notabilityIndex!)
  //       ) {
  //         bestPoint = bucket[index];
  //       }
  //     }
  //   }

  //   return bestPoint;
  // }
}
