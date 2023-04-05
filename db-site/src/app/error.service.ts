import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  handleError<T>(operation = 'operation', fallbackValue: T | undefined) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(operation, error);
      const castAttempt = error.error as T;
      if (castAttempt) {
        return of(castAttempt);
      }
      return of(fallbackValue as T);
    };
  }
}
