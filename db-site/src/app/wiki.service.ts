import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
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
    persons: Person[],
    getPageProperties: boolean,
    getPageTerms: boolean,
    thumbnailSize?: number,
    numExtractSentences?: number
  ): Observable<WikiApiPage[]> {
    const properties = [];
    if (getPageProperties) properties.push('pageprops');
    if (getPageTerms) properties.push('pageterms');
    if (thumbnailSize) properties.push('pageimages');
    if (numExtractSentences) properties.push('extracts');

    return this.http
      .get<WikiApiResponse>(wikipediaUrl, {
        params: new HttpParams({
          fromObject: {
            origin: '*', // Necessary for CORS.
            format: 'json',
            formatversion: 2,
            action: 'query',
            prop: properties.join('|'),
            piprop: 'thumbnail',
            inprop: 'url',
            pithumbsize: thumbnailSize ?? 600,
            explaintext: 1,
            exsectionformat: 'plain',
            exsentences: numExtractSentences ?? 4,
            titles: persons.map((it) => it.name).join('|'),
          },
        }),
      })
      .pipe(
        catchError(
          this.errorService.handleError('getDataFromEnglishWiki', {
            query: { pages: [] },
          } as WikiApiResponse)
        ),
        map((response) =>
          response.query.pages
            .filter((page) => !page.missing)
            .map((page) => {
              page.wikidataCode = Number(
                page.pageprops?.wikibase_item?.substring(1)
              );
              if (isNaN(page.wikidataCode)) page.wikidataCode = undefined;
              return page;
            })
        )
      );
  }
}
