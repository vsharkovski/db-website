import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { ErrorService } from './error.service';
import { Person } from './person.model';
import { WikiApiResponse } from './wiki-api-response.model';

/*
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages|pageterms&piprop=thumbnail&pithumbsize=600&titles=Albert%20Einstein
*/

@Injectable({
  providedIn: 'root',
})
export class WikidataService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getImageFromEnglishWiki(person: Person): Observable<string | null> {
    if (!person.name) {
      return of(null);
    }
    return this.http
      .get<WikiApiResponse>('/ext/api/wiki/en', {
        params: new HttpParams({
          fromObject: {
            action: 'query',
            format: 'json',
            formatversion: 2,
            prop: 'pageimages|pageterms',
            piprop: 'thumbnail',
            pithumbsize: 600,
            titles: person.name,
          },
        }),
      })
      .pipe(
        catchError(
          this.errorService.handleError(
            'getImageFromEnglishWiki',
            {} as WikiApiResponse
          )
        ),
        switchMap((response) => {
          const pages = response.query?.pages;
          if (!pages || pages.length == 0 || pages[0].missing) return of(null);
          return of(pages[0].thumbnail?.source ?? null);
        })
      );
  }
}
