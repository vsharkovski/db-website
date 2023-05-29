import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NumberRange } from '../number-range.model';

type ElementName = 'left' | 'right' | 'bar';

@Component({
  selector: 'dbw-range-selector',
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css'],
})
export class RangeSelectorComponent implements OnInit {
  @Input() minValue!: number;
  @Input() maxValue!: number;

  minValueSelected!: number;
  maxValueSelected!: number;

  @Output() selectionChanged = new EventEmitter<NumberRange>();

  selectedElement: ElementName | null = null;

  @ViewChild('selector') selectorElementRef?: ElementRef;

  constructor() {}

  ngOnInit(): void {
    this.minValueSelected = this.minValue;
    this.maxValueSelected = this.maxValue;
  }

  onMouseDown(element: ElementName) {
    this.selectedElement = element;
    console.log('Selected element', element);
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.selectedElement) {
      this.selectedElement = null;
      console.log('Deselected');
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.selectedElement || !this.selectorElementRef) return;

    const selectorBoundingBox =
      this.selectorElementRef.nativeElement.getBoundingClientRect();

    // X position of selector on the page. Takes scrolling into account.
    const selectorPositionX = selectorBoundingBox.x + window.scrollX;

    // Get difference between mouse X and selector X positions,
    // as a fraction of the size of the selector.
    const xDifferencePixels = event.pageX - selectorPositionX;
    const xDifferenceFraction = xDifferencePixels / selectorBoundingBox.width;

    // Get new value.
    let value =
      this.minValue + xDifferenceFraction * (this.maxValue - this.minValue);
    value = Math.round(value);
    value = Math.max(this.minValue, Math.min(this.maxValue, value));

    if (this.selectedElement == 'left') {
      // Update min selected value if below max selected.
      if (value <= this.maxValueSelected) {
        this.minValueSelected = value;
      }
    } else if (this.selectedElement == 'right') {
      // Update max selected value if above min selected.
      if (this.minValueSelected <= value) {
        this.maxValueSelected = value;
      }
    } else {
      // Bar
    }
  }

  getPercentageFromFraction(fraction: number): string {
    const result = Math.max(0, Math.min(100, 100 * fraction));
    return `${result}%`;
  }

  getPositionFractionFromValue(value: number): number {
    return (value - this.minValue) / (this.maxValue - this.minValue);
  }

  getPositionPercentageFromValue(value: number): string {
    return this.getPercentageFromFraction(
      this.getPositionFractionFromValue(value)
    );
  }

  getSizePercentageFromValues(min: number, max: number): string {
    const sizeFraction =
      this.getPositionFractionFromValue(max) -
      this.getPositionFractionFromValue(min);
    return this.getPercentageFromFraction(sizeFraction);
  }
}
