import { Component } from '@angular/core';
import { MapOptions, latLng, tileLayer } from 'leaflet';

@Component({
  selector: 'dbw-map-app',
  templateUrl: './map-app.component.html',
  styleUrls: ['./map-app.component.css'],
})
export class MapAppComponent {
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
}
