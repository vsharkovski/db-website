import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, ReplaySubject } from 'rxjs';
import { ErrorService } from './error.service';
import { Variable } from './variable.model';
import { VariablesAllResponse } from './variables-all-response.model';

@Injectable({
  providedIn: 'root',
})
export class VariablesService {
  variables$ = new ReplaySubject<VariablesAllResponse>();

  constructor(private http: HttpClient, private errorService: ErrorService) {
    this.getAllVariablesFromApi().subscribe((variables) =>
      this.variables$.next(variables)
    );
  }

  getGenders(): Observable<Variable[]> {
    return this.variables$.pipe(map((variables) => variables.genders));
  }

  getOccupations(): Observable<Variable[]> {
    return this.variables$.pipe(map((variables) => variables.occupations));
  }

  getCitizenships(): Observable<Variable[]> {
    return this.variables$.pipe(map((variables) => variables.citizenships));
  }

  getGenderMap(): Observable<[number: string]> {
    return this.variables$.pipe(
      map((variables) => this.createVariableMap(variables.genders))
    );
  }

  getOccupationMap(): Observable<[number: string]> {
    return this.variables$.pipe(
      map((variables) => this.createVariableMap(variables.occupations))
    );
  }

  getCitizenshipMap(): Observable<[number: string]> {
    return this.variables$.pipe(
      map((variables) => this.createVariableMap(variables.citizenships))
    );
  }

  private getAllVariablesFromApi(): Observable<VariablesAllResponse> {
    return this.http.get<VariablesAllResponse>('api/variables').pipe(
      catchError(
        this.errorService.handleError('getAllVariables', {
          success: false,
          genders: [],
          occupations: [],
          citizenships: [],
        })
      )
    );
  }

  private createVariableMap(variables: Variable[]): [number: string] {
    const mp = variables.reduce((mp, it) => {
      mp[it.id] = it.name;
      return mp;
    }, Object.create(null));
    mp[-1] = '~';
    return mp;
  }
}
