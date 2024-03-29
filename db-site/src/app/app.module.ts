import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavbarComponent } from './navbar/navbar.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { MainPageComponent } from './main-page/main-page.component';
import { HighlightsListComponent } from './highlights-list/highlights-list.component';
import { FiguresListComponent } from './figures-list/figures-list.component';
import { AboutComponent } from './about/about.component';
import { FigureComponent } from './figure/figure.component';
import { FiguresPageComponent } from './figures-page/figures-page.component';
import { FigureCarouselComponent } from './figure-carousel/figure-carousel.component';
import { HighlightsPageComponent } from './highlights-page/highlights-page.component';
import { PaperReferenceComponent } from './paper-reference/paper-reference.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SearchAppComponent } from './search-app/search-app.component';
import { SearchOptionsComponent } from './search-options/search-options.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DateYearPipe } from './date-year.pipe';
import { PersonDetailModalComponent } from './person-detail-modal/person-detail-modal.component';
import { UnknownYearPipe } from './unknown-year.pipe';
import { ReadableNamePipe } from './readable-name.pipe';
import { SearchResultsPageButtonsComponent } from './search-results-page-buttons/search-results-page-buttons.component';
import { SortDirectionPipe } from './sort-direction.pipe';
import { SortVariablePipe } from './sort-variable.pipe';
import { FooterComponent } from './footer/footer.component';
import { Event, NavigationEnd, Router, Scroll } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter, pairwise } from 'rxjs';
import { VariableSearchComponent } from './variable-search/variable-search.component';
import { PagePickerComponent } from './page-picker/page-picker.component';
import { ExportAppComponent } from './export-app/export-app.component';
import { TimelineAppComponent } from './timeline-app/timeline-app.component';
import { TimelineOptionsComponent } from './timeline-options/timeline-options.component';
import { TimelineCanvasComponent } from './timeline-canvas/timeline-canvas.component';
import { RangeSelectorComponent } from './range-selector/range-selector.component';
import { PersonSmallCardComponent } from './person-small-card/person-small-card.component';
import { TimelineCanvasMouseAreaComponent } from './timeline-canvas-mouse-area/timeline-canvas-mouse-area.component';
import { TimelineCanvasYearLineAreaComponent } from './timeline-canvas-year-line-area/timeline-canvas-year-line-area.component';
import { TimelineCanvasPainterComponent } from './timeline-canvas-painter/timeline-canvas-painter.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    NotFoundComponent,
    MainPageComponent,
    HighlightsListComponent,
    FiguresListComponent,
    AboutComponent,
    FigureComponent,
    FiguresPageComponent,
    FigureCarouselComponent,
    HighlightsPageComponent,
    PaperReferenceComponent,
    SidebarComponent,
    SearchAppComponent,
    SearchOptionsComponent,
    SearchResultsComponent,
    AboutPageComponent,
    DateYearPipe,
    PersonDetailModalComponent,
    UnknownYearPipe,
    ReadableNamePipe,
    SearchResultsPageButtonsComponent,
    SortDirectionPipe,
    SortVariablePipe,
    FooterComponent,
    VariableSearchComponent,
    PagePickerComponent,
    ExportAppComponent,
    TimelineAppComponent,
    TimelineOptionsComponent,
    TimelineCanvasComponent,
    RangeSelectorComponent,
    PersonSmallCardComponent,
    TimelineCanvasMouseAreaComponent,
    TimelineCanvasYearLineAreaComponent,
    TimelineCanvasPainterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(router: Router, viewportScroller: ViewportScroller) {
    router.events
      .pipe(
        filter((e: Event): e is Scroll => e instanceof Scroll),
        filter((e): boolean => e.routerEvent instanceof NavigationEnd),
        pairwise()
      )
      .subscribe(([previousEvent, currentEvent]) => {
        if (currentEvent.position) {
          // backward navigation
          viewportScroller.scrollToPosition(currentEvent.position);
        } else if (currentEvent.anchor) {
          // anchor navigation
          viewportScroller.scrollToAnchor(currentEvent.anchor);
        } else {
          // check if the route is different
          if (
            !this.areOnlyUrlQueryParamStringsDifferent(
              previousEvent,
              currentEvent
            )
          ) {
            // true forward navigation, not just query parameters changing
            // so scroll to top
            viewportScroller.scrollToPosition([0, 0]);
          }
        }
      });
  }

  private areOnlyUrlQueryParamStringsDifferent(
    event1: Scroll,
    event2: Scroll
  ): boolean {
    const routerEvent1 = event1.routerEvent as NavigationEnd;
    const [route1, query1] = routerEvent1.urlAfterRedirects.split('?');
    const routerEvent2 = event2.routerEvent as NavigationEnd;
    const [route2, query2] = routerEvent2.urlAfterRedirects.split('?');
    return route1 === route2 && query1 != query2;
  }
}
