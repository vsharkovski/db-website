import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import {
  ExportCreationResponse,
  ExportStatusResponse,
} from './export-response.model';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getExportStatus(id: number): Observable<string> {
    return this.http.get<ExportStatusResponse>(`api/export/status/${id}`).pipe(
      catchError(
        this.errorService.handleError('getExportStatus', {
          status: 'internal server error',
        })
      ),
      map((response) => response.status)
    );
  }

  requestExport(term: string): Observable<ExportCreationResponse> {
    return this.http
      .post<ExportCreationResponse>('api/export/create', {
        term: term,
      })
      .pipe(
        catchError(
          this.errorService.handleError('requestExport', { success: false })
        )
      );
  }

  getFileDownloadUrl(id: number): string {
    return `download/${id}`;
  }
}
