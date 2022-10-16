import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { MainPageComponent } from './main-page/main-page.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { FiguresListComponent } from './figures-list/figures-list.component';
import { AboutComponent } from './about/about.component';
import { FigureComponent } from './figure/figure.component';
import { FiguresPageComponent } from './figures-page/figures-page.component';
import { FigureCarouselComponent } from './figure-carousel/figure-carousel.component';
import { AppPreviewComponent } from './app-preview/app-preview.component';
import { AppsPageComponent } from './apps-page/apps-page.component';
import { PaperReferenceComponent } from './paper-reference/paper-reference.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    NotFoundComponent,
    MainPageComponent,
    AppsListComponent,
    FiguresListComponent,
    AboutComponent,
    FigureComponent,
    FiguresPageComponent,
    FigureCarouselComponent,
    AppPreviewComponent,
    AppsPageComponent,
    PaperReferenceComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
