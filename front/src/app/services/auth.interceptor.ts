
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const apiBaseUrl = environment.apiUrl.replace(/\/+$/, '');
  const isApiRequest = req.url.startsWith(`${apiBaseUrl}/`);

  // Cookie šaljemo samo našem API-ju.
  const authReq = isApiRequest
    ? req.clone({ withCredentials: true })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      const isLoginRequest = req.url.includes('/Auth/login');
      const isLogoutRequest = req.url.includes('/Auth/logout');
      const isAdminPage = router.url.startsWith('/admin');

      if (
        error.status === 401 &&
        isAdminPage &&
        !isLoginRequest &&
        !isLogoutRequest
      ) {
        authService.clearSession();
        void router.navigate(['/admin/login']);
      }

      return throwError(() => error);
    })
  );
};
