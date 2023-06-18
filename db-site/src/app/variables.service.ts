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
  occupationIdToColorMap$!: Observable<string[]>;

  readonly occupationNameToColorObject = {
    Culture: 'rgb(103, 174, 59)',
    'Sports/Games': 'rgb(156, 132, 197)',
    Leadership: 'rgb(212, 85, 96)',
    'Discovery/Science': 'rgb(91, 135, 198)',
    Other: 'rgb(255, 211, 23)',
  };

  constructor(private http: HttpClient, private errorService: ErrorService) {
    this.getAllVariablesFromApi().subscribe((variables) =>
      this.variables$.next(variables)
    );
    this.occupationIdToColorMap$ = this.getOccupations().pipe(
      map((occupations) => this.createOccupationIdToColorMap(occupations))
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

  getOccupationIdToColorMap(): Observable<string[]> {
    return this.occupationIdToColorMap$;
  }

  private getAllVariablesFromApi(): Observable<VariablesAllResponse> {
    return this.http.get<VariablesAllResponse>('api/variables').pipe(
      catchError(
        this.errorService.handleError('getAllVariables', {
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

  private createOccupationIdToColorMap(occupations: Variable[]): string[] {
    const result: string[] = [];
    const maxId = occupations.reduce((max, curr) => Math.max(max, curr.id), 0);

    // Fill results with a backup color.
    for (let i = 0; i < maxId + 1; i++) result.push('rgb(100, 100, 100)');

    const occupationNameToColorMap = new Map(
      Object.entries(this.occupationNameToColorObject)
    );

    for (const occ of occupations) {
      const color = occupationNameToColorMap.get(occ.name);
      if (color) {
        result[occ.id] = color;
      }
    }

    return result;
  }
}
