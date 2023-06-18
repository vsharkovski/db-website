import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Person } from '../person.model';
import { WikiApiPage } from '../wiki-api-page.model';
import { ReplaySubject, Subject, combineLatest, debounceTime } from 'rxjs';
import { PixelCoordinate } from '../pixel-coordinate.model';
import { VariablesService } from '../variables.service';

@Component({
  selector: 'dbw-person-small-card',
  templateUrl: './person-small-card.component.html',
  styleUrls: ['./person-small-card.component.css'],
})
export class PersonSmallCardComponent implements OnChanges, OnInit {
  @Input('person') personInjected: Person | null = null;
  @Input('wikiPage') wikiPageInjected: WikiApiPage | null = null;
  @Input() showPicture: boolean = false;

  @Output() dimensionsChanged = new EventEmitter<PixelCoordinate>();

  person$ = new ReplaySubject<Person | null>();
  person: Person | null = null;
  wikiPage: WikiApiPage | null = null;
  isDisappearing = false;
  isImageLoaded = false;

  dimensions: PixelCoordinate = { x: 0, y: 0 };
  checkDimensions$ = new Subject<void>();

  borderColor: string = 'var(--bs-primary)';

  constructor(
    private elementRef: ElementRef,
    private variablesService: VariablesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const changePerson = changes['personInjected'];
    if (changePerson) {
      if (changePerson.currentValue === null) {
        this.isDisappearing = true;
      } else {
        this.person$.next(changePerson.currentValue);
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

  ngOnInit(): void {
    this.checkDimensions$.pipe(debounceTime(50)).subscribe(() => {
      const height = this.elementRef.nativeElement.offsetHeight;
      const width = this.elementRef.nativeElement.offsetWidth;

      if (width != this.dimensions.x || height != this.dimensions.y) {
        this.dimensions = { x: width, y: height };
        this.dimensionsChanged.emit(this.dimensions);
      }
    });

    this.person$.subscribe((person) => (this.person = person));

    combineLatest([
      this.variablesService.getOccupationIdToColorMap(),
      this.person$,
    ]).subscribe(([occupationMap, person]) => {
      this.borderColor = occupationMap[person?.level1MainOccId!];
    });
  }

  onImageLoad(): void {
    this.isImageLoaded = true;
    this.checkDimensions$.next();
  }
}
