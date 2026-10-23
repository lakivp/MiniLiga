import {
  CommonModule
} from '@angular/common';

import {
  Component
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { AuthService } from '../../../services/auth.service';



@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent {

  mobileMenuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMenu(): void {
    this.mobileMenuOpen =
      !this.mobileMenuOpen;
  }

  closeMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {

    this.authService.logout();

    this.closeMenu();

    this.router.navigate([
      '/admin/login'
    ]);
  }
}