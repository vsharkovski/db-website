import { Injectable } from '@angular/core';
import TempLocationDataJson from '../assets/data/map-test.json';
import { PersonLocation } from './person-location.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  locations: PersonLocation[] = [];

  constructor() {
    this.locations = TempLocationDataJson.map((it) => ({
      wikidataCode: Number(it.wikidata_code.substring(1)),
      name: it.url,
      order: it.link_order,
      sentence: it.sentence,
      location_name: it.location_name,
      latitude: Number(it.Latitude),
      longitude: Number(it.Longitude),
      year: it.final_year,
    }));
  }

  getLocations(): Observable<PersonLocation[]> {
    return of(this.locations);
  }
}
