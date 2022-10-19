import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { HighlightsPageComponent } from './highlights-page/highlights-page.component';
import { FiguresPageComponent } from './figures-page/figures-page.component';
import { MainPageComponent } from './main-page/main-page.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: MainPageComponent,
    title: 'A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'highlights',
    component: HighlightsPageComponent,
    title:
      'Highlights - A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'figures',
    component: FiguresPageComponent,
    title:
      'Figures - A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'About - A cross-verified database of notable people, 3500BC-2018AD',
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
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
