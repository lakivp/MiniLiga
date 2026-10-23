import {
  CommonModule
} from '@angular/common';

import {
  Component
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {

    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage =
        'Unesite email adresu.';

      return;
    }

    if (!this.password) {
      this.errorMessage =
        'Unesite lozinku.';

      return;
    }

    this.loading = true;

    this.authService
      .login(
        this.email.trim(),
        this.password
      )
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate([
            '/admin'
          ]);
        },

        error: error => {

          console.error(
            'Greška prilikom prijave:',
            error
          );

          this.loading = false;

          this.errorMessage =
            error?.error?.message ??
            'Email ili lozinka nisu ispravni.';
        }

      });
  }

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }
}