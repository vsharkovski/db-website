import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

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
  ],
  imports: [BrowserModule, AppRoutingModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
