import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
} from '@angular/core';
import { PixelPair } from './pixel-pair.model';
import { Observable, ReplaySubject, map } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[dbwMouseTracker]',
})
export class MouseTrackerDirective implements AfterViewInit {
  current$ = new ReplaySubject<PixelPair | null>();
  currentFraction$ = new ReplaySubject<PixelPair | null>();
  lastInside$ = new ReplaySubject<PixelPair | null>();
  lastInsideFraction$ = new ReplaySubject<PixelPair | null>();
  isInside$!: Observable<{ x: boolean; y: boolean }>;

  constructor(private elementRef: ElementRef) {
    this.isInside$ = this.currentFraction$.pipe(
      map((fraction) => ({
        x: fraction !== null && fraction.x >= 0 && fraction.x < 1,
        y: fraction !== null && fraction.y >= 0 && fraction.y < 1,
      }))
    );
  }

  ngAfterViewInit(): void {
    this.current$.next(null);
    this.currentFraction$.next(null);
    this.lastInside$.next(null);
    this.lastInsideFraction$.next(null);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.current$.next(null);
    this.currentFraction$.next(null);
    this.lastInside$.next(null);
    this.lastInsideFraction$.next(null);
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    const boundingBox = this.elementRef.nativeElement.getBoundingClientRect();

    const current = {
      x: Math.round(event.pageX - (boundingBox.x + window.scrollX)),
      y: Math.round(event.pageY - (boundingBox.y + window.scrollY)),
    };

    const fraction: PixelPair = {
      x: current.x / boundingBox.width,
      y: current.y / boundingBox.height,
    };

    this.current$.next(current);
    this.currentFraction$.next(fraction);

    if (
      current.x >= 0 &&
      current.x < boundingBox.width &&
      current.y >= 0 &&
      current.y < boundingBox.height
    ) {
      this.lastInside$.next(current);
      this.lastInsideFraction$.next(fraction);
    }
  }
}
