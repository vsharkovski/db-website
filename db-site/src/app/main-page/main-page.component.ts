import { LocationStrategy } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import FiguresDataFullJson from '../../assets/figures/figures-data-full.json';
import { FigureData } from '../figure-data.model';

@Component({
  selector: 'dbw-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent implements OnInit {
  readonly baseHref!: string;
  figures!: FigureData[];

  constructor(private locationStrategy: LocationStrategy) {
    this.baseHref = this.locationStrategy.getBaseHref();
  }

  ngOnInit(): void {
    this.figures = FiguresDataFullJson.map((it) => {
      const result = { ...it };
      result.imageSource = `${this.baseHref}${it.imageSource}`;
      return result;
    });
  }
}
