import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';
import { AltmetricResponse } from './altmetric-response.model';
import { Observable, catchError } from 'rxjs';

/*
https://api.altmetric.com/
*/

const apiUrl = 'http://api.altmetric.com/v1/id/129575296';

@Injectable({
  providedIn: 'root',
})
export class AltmetricService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getDetails(): Observable<AltmetricResponse | null> {
    return this.http
      .get<AltmetricResponse>(apiUrl)
      .pipe(catchError(this.errorService.handleError('getDetails', null)));
  }
}
