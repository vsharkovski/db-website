import { Component } from '@angular/core';

@Component({
  selector: 'dbw-highlights-list',
  templateUrl: './highlights-list.component.html',
  styleUrls: ['./highlights-list.component.css'],
})
export class HighlightsListComponent {
  topiLink: string = 'https://tjukanovt.github.io/notable-people';
  altmetricLink: string =
    'https://nature.altmetric.com/details/129575296#score';
}