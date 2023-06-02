import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { ExportService } from '../export.service';

@Component({
  selector: 'dbw-export-app',
  templateUrl: './export-app.component.html',
  styleUrls: ['./export-app.component.css'],
})
export class ExportAppComponent implements OnChanges, OnInit, OnDestroy {
  @Input() term!: string;
  status: string = 'not requested';
  downloadUrl?: string;

  status$ = new Subject<string>();
  jobId$ = new Subject<number>();
  componentDestroyed$ = new Subject<void>();

  constructor(private exportService: ExportService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['term']) {
      this.status$.next('not requested');
    }
  }

  ngOnInit(): void {
    // Update variables for displaying whenever status or job id changes.
    this.status$.subscribe((status) => (this.status = status));
    this.jobId$.subscribe(
      (id) => (this.downloadUrl = this.exportService.getFileDownloadUrl(id))
    );

    /*
    When status changes to the desired status, or job id changes,
    or timer for that status emits signal, ask server for status of the job.
    If server should be processing the job, ask for status every 2 seconds.
    If server has finished processing it, ask for status every 10 seconds.
    */
    const statusToTimer = [
      ['processing', timer(0, 2000)],
      ['success', timer(0, 10000)],
    ];
    const statusDistinct$ = this.status$.pipe(distinctUntilChanged());

    for (let [desiredStatus, targetTimer] of statusToTimer) {
      combineLatest([statusDistinct$, this.jobId$, targetTimer])
        .pipe(
          filter(([status, _, __]) => status == desiredStatus),
          switchMap(([_, id, __]) => this.exportService.getExportStatus(id)),
          takeUntil(this.componentDestroyed$)
        )
        .subscribe((exportStatus) => {
          switch (exportStatus) {
            case 'unprocessed':
            case 'processing':
              this.status$.next('processing');
              break;
            case 'process fail':
              this.status$.next('fail');
              break;
            case 'process success':
              this.status$.next('success');
              break;
            case 'invalid id':
              this.status$.next('expired');
              break;
            default:
              this.status$.next('fail');
              break;
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  onExportRequestButtonClick(): void {
    this.status$.next('requested');

    this.exportService.requestExport(this.term).subscribe((response) => {
      if (response.success) {
        this.status$.next('processing');
        this.jobId$.next(response.id!!);
      } else {
        this.status$.next('fail');
      }
    });
  }
}
