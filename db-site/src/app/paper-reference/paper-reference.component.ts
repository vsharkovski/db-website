import { Component, Input } from '@angular/core';

@Component({
  selector: 'dbw-paper-reference',
  templateUrl: './paper-reference.component.html',
  styleUrls: ['./paper-reference.component.css'],
})
export class PaperReferenceComponent {
  @Input() description?: string;
  @Input() paperTitle?: string;
  @Input() paperUrl?: string;
  @Input() inlineCitation?: string;
  @Input() bibtexCitation?: string;
}
