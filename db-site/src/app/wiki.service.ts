import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ErrorService } from './error.service';
import { Person } from './person.model';
import { WikiApiPage } from './wiki-api-page.model';
import { WikiApiResponse } from './wiki-api-response.model';

/*
https://en.wikipedia.org/w/api.php
?action=query
&format=json
&formatversion=2
&prop=pageprops|pageimages|pageterms|extracts|info
&piprop=thumbnail
&inprop=url
&pithumbsize=600
&explaintext=1
&exsectionformat=plain
&exsentences=4
&titles=Albert%20Einstein
*/

const wikipediaUrl = 'https://en.wikipedia.org/w/api.php';
// const wikidataUrl = 'https://www.wikidata.org/w/rest.php/wikibase/v0/entities/items/';

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getDataFromEnglishWiki(
    person: Person,
    thumbnailSize?: number
  ): Observable<WikiApiPage | null> {
    if (!person.name) {
      return of(null);
    }
    if (thumbnailSize === undefined) {
      thumbnailSize = 600;
    }
    return this.http
      .get<WikiApiResponse>(wikipediaUrl, {
        params: new HttpParams({
          fromObject: {
            origin: '*', // Necessary for CORS.
            format: 'json',
            formatversion: 2,
            action: 'query',
            prop: 'pageprops|pageimages|pageterms|extracts|info',
            piprop: 'thumbnail',
            inprop: 'url',
            pithumbsize: thumbnailSize,
            explaintext: 1,
            exsectionformat: 'plain',
            exsentences: 4,
            titles: person.name,
          },
        }),
      })
      .pipe(
        catchError(
          this.errorService.handleError('getDataFromEnglishWiki', null)
        ),
        map((response) => {
          if (!response || !this.doesPageExistInResponse(response)) {
            return null;
          }
          return response!.query!.pages![0];
        })
      );
  }

  private doesPageExistInResponse(response: WikiApiResponse): boolean {
    const pages = response?.query?.pages;
    if (!pages || pages.length == 0 || pages[0].missing) {
      return false;
    }
    return true;
  }
}
