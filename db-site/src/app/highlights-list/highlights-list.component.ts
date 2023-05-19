import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AltmetricService } from '../altmetric.service';
import { AltmetricResponse } from '../altmetric-response.model';
import ArticlesUsingUsJson from '../../assets/data/articles-using-us.json';

@Component({
  selector: 'dbw-highlights-list',
  templateUrl: './highlights-list.component.html',
  styleUrls: ['./highlights-list.component.css'],
})
export class HighlightsListComponent implements OnInit {
  topiProjectLink: string = 'https://tjukanovt.github.io/notable-people';
  topiPersonalLink: string = 'https://tjukanov.org/';
  altmetricLink: string = 'https://nature.altmetric.com/details/129575296/news';
  inquisitiveBirdTwitterLink: string =
    'https://web.archive.org/web/20221024113028/https://twitter.com/Scientific_Bird/status/1584237159006945280';

  articlesUsingUs: { url: string; title: string }[] = ArticlesUsingUsJson;

  altmetricResponse: AltmetricResponse | null = null;

  constructor(
    private router: Router,
    private altmetricService: AltmetricService
  ) {}

  ngOnInit(): void {
    this.altmetricService
      .getDetails()
      .subscribe((result) => (this.altmetricResponse = result));
  }

  onSearchOptionsSubmit(term: string): void {
    // Navigate to search page and load it with the term from the options.
    this.router.navigate(['search'], { queryParams: { term: term } });
  }
}
