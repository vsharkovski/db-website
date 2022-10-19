import { LocationStrategy } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dbw-highlight',
  templateUrl: './highlight.component.html',
  styleUrls: ['./highlight.component.css'],
})
export class HighlightComponent {
  readonly baseHref: string = '';

  @Input() title?: string;
  @Input() description?: string;
  @Input() imageSource?: string;
  @Input() targetUrl?: string;
  @Input() targetRoute?: string;

  constructor(private locationStrategy: LocationStrategy) {
    const href = this.locationStrategy.getBaseHref();
    if (href !== '/') {
      this.baseHref = this.locationStrategy.getBaseHref();
    }
  }
}
