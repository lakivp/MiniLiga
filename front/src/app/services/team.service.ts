import { Injectable } from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';
import { environment } from '../../environments/environment';

export interface Team {
  id: number;

  name: string;

  shortName: string | null;

  logoUrl: string | null;

  primaryColor: string | null;

  secondaryColor: string | null;

  description: string | null;

  isActive: boolean;

  createdAt: string;

  playerCount?: number;
}

export interface CreateTeam {
  name: string;

  shortName: string | null;

  logoUrl: string | null;

  primaryColor: string | null;

  secondaryColor: string | null;

  description: string | null;

  isActive: boolean;
}

export interface UpdateTeam {
  name: string;

  shortName: string | null;

  logoUrl: string | null;

  primaryColor: string | null;

  secondaryColor: string | null;

  description: string | null;

  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private readonly apiUrl =
    `${environment.apiUrl}/Teams`;

  constructor(
    private http: HttpClient
  ) {}

  getAll(): Observable<Team[]> {

    return this.http.get<Team[]>(
      this.apiUrl
    );
  }

  getById(
    id: number
  ): Observable<Team> {

    return this.http.get<Team>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    team: CreateTeam
  ): Observable<Team> {

    return this.http.post<Team>(
      this.apiUrl,
      team
    );
  }

  update(
    id: number,
    team: UpdateTeam
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      team
    );
  }

  uploadLogo(
    id: number,
    file: File
  ): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ logoUrl: string }>(
      `${this.apiUrl}/${id}/logo`,
      formData
    );
  }

  deleteLogo(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}/logo`
    );
  }

  delete(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}