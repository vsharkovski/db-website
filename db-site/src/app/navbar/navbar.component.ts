import { ViewportScroller } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'dbw-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  isNavbarCollapsed: boolean = true;
  routerSubscription?: Subscription;

  @ViewChild('navbar') navbarElement?: ElementRef;

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Collapse navbar (if vertical) every time navigation happens
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isNavbarCollapsed = true;
      }
    });
  }

  ngAfterViewInit(): void {
    // Set viewport scroller offset to this height
    if (this.navbarElement?.nativeElement) {
      this.viewportScroller.setOffset([
        0,
        this.navbarElement.nativeElement.offsetHeight,
      ]);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
