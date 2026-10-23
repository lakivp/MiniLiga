import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';
import { environment } from '../../environments/environment';

export interface Player {

  id: number;

  firstName: string;

  lastName: string;

  displayName: string | null;

  jerseyNumber: number | null;

  position: string | null;

  photoUrl: string | null;

  teamId: number;

  teamName: string;

  isActive: boolean;
}

export interface CreatePlayerRequest {

  firstName: string;

  lastName: string;

  displayName: string | null;

  jerseyNumber: number | null;

  position: string | null;

  photoUrl: string | null;

  teamId: number;

  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private readonly apiUrl =
    `${environment.apiUrl}/Players`;

  constructor(
    private http: HttpClient
  ) {}

  getAll(): Observable<Player[]> {

    return this.http.get<Player[]>(
      this.apiUrl
    );
  }

  getByTeam(
    teamId: number
  ): Observable<Player[]> {

    return this.getAll().pipe(

      map(players =>
        players.filter(
          player =>
            player.teamId === teamId &&
            player.isActive
        )
      )
    );
  }

  getById(
    id: number
  ): Observable<Player> {

    return this.http.get<Player>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    player: CreatePlayerRequest
  ): Observable<Player> {

    return this.http.post<Player>(
      this.apiUrl,
      player
    );
  }

  update(
    id: number,
    player: CreatePlayerRequest
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      player
    );
  }

  uploadPhoto(
    id: number,
    file: File
  ): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ photoUrl: string }>(
      `${this.apiUrl}/${id}/photo`,
      formData
    );
  }

  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}/photo`
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
