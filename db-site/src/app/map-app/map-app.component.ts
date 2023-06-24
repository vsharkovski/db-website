import { Component, OnInit } from '@angular/core';
import { Layer, Map, MapOptions, latLng, tileLayer } from 'leaflet';
import { BehaviorSubject, ReplaySubject, switchMap } from 'rxjs';
import { LocationService } from '../location.service';
import { PersonLocation } from '../person-location.model';

@Component({
  selector: 'dbw-map-app',
  templateUrl: './map-app.component.html',
  styleUrls: ['./map-app.component.css'],
})
export class MapAppComponent implements OnInit {
  strMaps = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    attribution: '...',
  });
  wMaps = tileLayer('http://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
    detectRetina: true,
    attribution: '...',
  });

  layersControl = {
    baseLayers: {
      'Street Maps': this.strMaps,
      'Wikimedia Maps': this.wMaps,
    },
    overlays: {},
  };

  options: MapOptions = {
    layers: [this.strMaps],
    zoom: 7,
    center: latLng([46.879966, -121.726909]),
  };

  layers: Layer[] = [];

  map: Map | null = null;
  mapLoaded$ = new ReplaySubject<void>();

  locations: PersonLocation[] = [];
  selectedLocationIndex: number | null = null;
  selectedLocationIndex$ = new BehaviorSubject<number | null>(null);

  constructor(private locationService: LocationService) {}

  ngOnInit() {
    this.locationService.getLocations().subscribe((locations) => {
      this.locations = locations;
      this.selectedLocationIndex$.next(0);
    });

    this.mapLoaded$
      .pipe(switchMap(() => this.selectedLocationIndex$))
      .subscribe((index) => {
        this.selectedLocationIndex = index;
        if (index === null) return;

        const location = this.locations[index];
        this.map!.flyTo({ lat: location.latitude, lng: location.longitude });
      });
  }

  onMapReady(map: Map) {
    this.map = map;
    this.mapLoaded$.next();
  }

  onClick(change: number) {
    if (this.selectedLocationIndex === null) return;
    const newIndex = this.selectedLocationIndex + change;
    if (newIndex >= 0 && newIndex < this.locations.length) {
      this.selectedLocationIndex$.next(newIndex);
    }
  }
}
