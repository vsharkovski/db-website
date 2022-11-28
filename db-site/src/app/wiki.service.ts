import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { ErrorService } from './error.service';
import { Person } from './person.model';
import { WikiApiPage } from './wiki-api-page.model';
import { WikiApiResponse } from './wiki-api-response.model';

/*
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages|pageterms&piprop=thumbnail&pithumbsize=600&titles=Albert%20Einstein
*/

/*
Possible improvement:
Check different wikipedia versions on fail
*/

const apiUrl = 'https://en.wikipedia.org/w/api.php';

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getDataFromEnglishWiki(person: Person): Observable<WikiApiPage | null> {
    if (!person.name) {
      return of(null);
    }
    return this.http
      .get<WikiApiResponse>(apiUrl, {
        params: new HttpParams({
          fromObject: {
            origin: '*', // necessary because CORS
            format: 'json',
            formatversion: 2,
            action: 'query',
            prop: 'pageimages|pageterms|extracts',
            piprop: 'thumbnail',
            pithumbsize: 600,
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
        switchMap((response) => {
          if (!response || !this.doesPageExistInResponse(response))
            return of(null);
          return of(this.computeAdditionalPageData(response!.query!.pages![0]));
        })
      );
  }

  private doesPageExistInResponse(response: WikiApiResponse): boolean {
    const pages = response?.query?.pages;
    if (!pages || pages.length == 0 || pages[0].missing) return false;
    return true;
  }

  private computeAdditionalPageData(page: WikiApiPage): WikiApiPage {
    const result = { ...page };
    if (result.title) {
      result.wikipediaUrl = `https://en.wikipedia.org/wiki/${result.title}`;
    }
    return result;
  }
}
