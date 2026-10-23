import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, of, finalize } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Admin {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  expiresAt: string;
  admin: Admin;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/Auth`;
  private currentAdmin: Admin | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.currentAdmin = response.admin;
      })
    );
  }

  getAdmin(): Admin | null {
    return this.currentAdmin;
  }

  isLoggedIn(): boolean {
    return this.currentAdmin !== null;
  }

  me(): Observable<Admin> {
    return this.http.get<Admin>(
      `${this.apiUrl}/me`,
      { withCredentials: true }
    ).pipe(
      tap(admin => {
        this.currentAdmin = admin;
      })
    );
  }

  checkSession(): Observable<boolean> {
    return this.me().pipe(
      map(() => true),
      catchError(() => {
        this.currentAdmin = null;
        return of(false);
      })
    );
  }

  logout(): void {
    this.http.post<void>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      catchError(() => of(undefined)),
      finalize(() => {
        this.currentAdmin = null;
        void this.router.navigate(['/admin/login']);
      })
    ).subscribe();
  }

  clearSession(): void {
    this.currentAdmin = null;
  }
}