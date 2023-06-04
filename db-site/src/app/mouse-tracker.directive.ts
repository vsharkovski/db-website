import { Directive, ElementRef, HostListener } from '@angular/core';
import { PixelCoordinate } from './pixel-coordinate.model';
import { ReplaySubject } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[dbwMouseTracker]',
})
export class MouseTrackerDirective {
  current$ = new ReplaySubject<PixelCoordinate | null>();
  lastValid$ = new ReplaySubject<PixelCoordinate | null>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('window:resize')
  onWindowResize(): void {
    this.current$.next(null);
    this.lastValid$.next(null);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const boundingBox = this.elementRef.nativeElement.getBoundingClientRect();

    const clamp = (x: number, min: number, max: number) =>
      Math.max(min, Math.min(max, x));

    const current = {
      x: clamp(
        Math.round(event.pageX - (boundingBox.x + window.scrollX)),
        0,
        boundingBox.width - 1
      ),
      y: clamp(
        Math.round(event.pageY - (boundingBox.y + window.scrollY)),
        0,
        boundingBox.height - 1
      ),
    };

    this.current$.next(current);
    this.lastValid$.next(current);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.current$.next(null);
  }
}
