import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HighlightsPageComponent } from './highlights-page/highlights-page.component';
import { FiguresPageComponent } from './figures-page/figures-page.component';
import { MainPageComponent } from './main-page/main-page.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SearchAppComponent } from './search-app/search-app.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { TimelineAppComponent } from './timeline-app/timeline-app.component';
import { MapAppComponent } from './map-app/map-app.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: MainPageComponent,
    title: 'A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'search',
    component: SearchAppComponent,
    title: 'Search - Notable people',
  },
  {
    path: 'timeline',
    component: TimelineAppComponent,
    title: 'Timeline - Notable people',
  },
  {
    path: 'map',
    component: MapAppComponent,
    title: 'Map - Notable people',
  },
  {
    path: 'highlights',
    component: HighlightsPageComponent,
    title: 'Highlights - Notable people',
  },
  {
    path: 'figures',
    component: FiguresPageComponent,
    title: 'Figures - Notable people',
  },
  {
    path: 'about',
    component: AboutPageComponent,
    title: 'About - Notable people',
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: 'Page not found',
  },
  {
    path: 'home',
    redirectTo: '',
  },
  { path: '**', pathMatch: 'full', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
