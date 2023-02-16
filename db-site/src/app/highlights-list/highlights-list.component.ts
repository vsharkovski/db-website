import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dbw-highlights-list',
  templateUrl: './highlights-list.component.html',
  styleUrls: ['./highlights-list.component.css'],
})
export class HighlightsListComponent {
  topiLink: string = 'https://tjukanovt.github.io/notable-people';
  altmetricLink: string =
    'https://nature.altmetric.com/details/129575296#score';
  inquisitiveBirdTwitterLink: string =
    'https://web.archive.org/web/20221024113028/https://twitter.com/Scientific_Bird/status/1584237159006945280';

  constructor(private router: Router) {}

  onSearchOptionsSubmit(term: string): void {
    // Navigate to search page and load it with the term from the options.
    this.router.navigate(['search'], { queryParams: { term: term } });
  }
}
