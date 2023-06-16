import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Person } from '../person.model';
import { WikiApiPage } from '../wiki-api-page.model';
import { Subject, debounceTime } from 'rxjs';
import { PixelCoordinate } from '../pixel-coordinate.model';

@Component({
  selector: 'dbw-person-small-card',
  templateUrl: './person-small-card.component.html',
  styleUrls: ['./person-small-card.component.css'],
})
export class PersonSmallCardComponent implements OnChanges {
  @Input('person') personInjected: Person | null = null;
  @Input('wikiPage') wikiPageInjected: WikiApiPage | null = null;
  @Input() showPicture: boolean = false;

  @Output() dimensionsChanged = new EventEmitter<PixelCoordinate>();

  person: Person | null = null;
  wikiPage: WikiApiPage | null = null;
  isDisappearing = false;
  isImageLoaded = false;

  dimensions: PixelCoordinate = { x: 0, y: 0 };
  checkDimensions$ = new Subject<void>();

  constructor(private elementRef: ElementRef) {
    this.checkDimensions$.pipe(debounceTime(50)).subscribe(() => {
      const height = this.elementRef.nativeElement.offsetHeight;
      const width = this.elementRef.nativeElement.offsetWidth;

      if (width != this.dimensions.x || height != this.dimensions.y) {
        this.dimensions = { x: width, y: height };
        this.dimensionsChanged.emit(this.dimensions);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const changePerson = changes['personInjected'];
    if (changePerson) {
      if (changePerson.currentValue === null) {
        this.isDisappearing = true;
      } else {
        this.person = changePerson.currentValue;
        this.checkDimensions$.next();
      }
    }

    const changeWiki = changes['wikiPageInjected'];
    if (changeWiki) {
      this.isImageLoaded = false;
      if (changeWiki.currentValue !== null) {
        this.wikiPage = changeWiki.currentValue;
        this.checkDimensions$.next();
      }
    }
  }

  onImageLoad(): void {
    this.isImageLoaded = true;
    this.checkDimensions$.next();
  }
}
