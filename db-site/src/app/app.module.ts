import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
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
import { MapComponent } from './map/map.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DateYearPipe } from './date-year.pipe';
import { IntSliderComponent } from './int-slider/int-slider.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
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
    MapComponent,
    AboutPageComponent,
    DateYearPipe,
    IntSliderComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, NgbModule, HttpClientModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
