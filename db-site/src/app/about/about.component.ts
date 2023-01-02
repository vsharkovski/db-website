import { Component, Input } from '@angular/core';
import ReferencesDataJson from '../../assets/data/paper-references.json';
import { ReferenceData } from '../reference-data.model';

@Component({
  selector: 'dbw-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  @Input() showAboutHeading: boolean = true;
  references: ReferenceData[] = ReferencesDataJson;
}
