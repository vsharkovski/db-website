import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { FiguresPageComponent } from './figures-page/figures-page.component';
import { MainPageComponent } from './main-page/main-page.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PapersInfoComponent } from './papers-info/papers-info.component';

const routes: Routes = [
  {
    path: 'home',
    component: MainPageComponent,
    title: 'A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'apps',
    component: AppsListComponent,
    title: 'Apps - A cross-verified database of notable people, 3500BC-2018AD',
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
    path: 'papers',
    component: PapersInfoComponent,
    title:
      'Papers - A cross-verified database of notable people, 3500BC-2018AD',
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: 'Page not found',
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', pathMatch: 'full', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
