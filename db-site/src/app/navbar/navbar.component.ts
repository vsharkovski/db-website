import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dbw-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  isNavbarCollapsed: boolean = true;

  constructor(private router: Router) {}
}
