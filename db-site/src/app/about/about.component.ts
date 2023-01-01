import { ViewportScroller } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, first } from 'rxjs';
import { ReferenceData } from '../reference-data.model';
import ReferencesDataJson from '../../assets/data/paper-references.json';

@Component({
  selector: 'dbw-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  @Input() showAboutHeading: boolean = true;
  references: ReferenceData[] = ReferencesDataJson;

  constructor(
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) {}

  ngAfterViewInit(): void {
    // Scroll to fragment on page load, if fragment is present.
    this.route.fragment
      .pipe(
        filter((fragment) => fragment !== null),
        first()
      )
      .subscribe((fragment) => {
        this.viewportScroller.scrollToAnchor(fragment!);
      });
  }
}
