import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MatchLineup {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
  playerPhotoUrl: string | null;

  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;

  isStarter: boolean;
  isSubstitute: boolean;

  position: string | null;
  order: number;

  enteredMinute: number | null;
  leftMinute: number | null;

  notes: string | null;
}

export interface CreateMatchLineup {
  playerId: number;
  teamId: number;
  isStarter: boolean;
  isSubstitute: boolean;
  position: string | null;
  order: number;
  enteredMinute: number | null;
  leftMinute: number | null;
  notes: string | null;
}

export interface UpdateMatchLineup {
  isStarter: boolean;
  isSubstitute: boolean;
  position: string | null;
  order: number;
  enteredMinute: number | null;
  leftMinute: number | null;
  notes: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MatchLineupService {

  private readonly apiUrl =
    `${environment.apiUrl}/MatchLineups`;

  constructor(
    private http: HttpClient
  ) {}

  getMatchLineup(
    matchId: number
  ): Observable<MatchLineup[]> {

    return this.http.get<MatchLineup[]>(
      `${this.apiUrl}/match/${matchId}`
    );
  }

  populateCurrentRoster(
    matchId: number
  ): Observable<MatchLineup[]> {
    return this.http.post<MatchLineup[]>(
      `${this.apiUrl}/match/${matchId}/populate-current-roster`,
      {}
    );
  }

  getById(
    id: number
  ): Observable<MatchLineup> {

    return this.http.get<MatchLineup>(
      `${this.apiUrl}/${id}`
    );
  }

  addPlayer(
    matchId: number,
    data: CreateMatchLineup
  ): Observable<MatchLineup> {

    return this.http.post<MatchLineup>(
      `${this.apiUrl}/match/${matchId}`,
      data
    );
  }

  updatePlayer(
    id: number,
    data: UpdateMatchLineup
  ): Observable<MatchLineup> {

    return this.http.put<MatchLineup>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  removePlayer(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}

