import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.me().pipe(
    map(() => true),
    catchError(() =>
      of(router.createUrlTree(['/admin/login']))
    )
  );
};