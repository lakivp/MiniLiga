import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  private readonly apiUrl =
    `${environment.apiUrl}`;;

  constructor(
    private http: HttpClient
  ) {}

  getMatchDetails(matchId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/MatchDetails/${matchId}`
    );
  }

  startMatch(matchId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/matches/${matchId}/start`,
      {}
    );
  }

  finishMatch(matchId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/matches/${matchId}/finish`,
      {}
    );
  }

  addEvent(
    matchId: number,
    event: {
      playerId?: number | null;
      relatedPlayerId?: number | null;
      type: number;
      minute: number;
      description?: string | null;
    }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/matches/${matchId}/events`,
      event
    );
  }

  deleteEvent(
    matchId: number,
    eventId: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/matches/${matchId}/events/${eventId}`
    );
  }
}