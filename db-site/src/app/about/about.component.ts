import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, first, Subscription } from 'rxjs';

@Component({
  selector: 'dbw-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  @Input() showAboutHeading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) {}

  ngAfterViewInit(): void {
    // Scroll to fragment on page load, if fragment is present
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
