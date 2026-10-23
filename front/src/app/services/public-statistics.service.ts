import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicCompetitionOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface PublicPlayerStatistic {
  playerId: number;

  playerName: string;

  jerseyNumber: number | null;

  photoUrl: string | null;

  teamId: number;

  teamName: string;

  teamLogoUrl: string | null;

  goals: number;

  assists: number;
}

export interface PublicStatisticsResponse {
  competitionId: number;

  competitionName: string;

  topScorers: PublicPlayerStatistic[];

  topAssists: PublicPlayerStatistic[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicStatisticsService {

  private readonly apiUrl =
    `${environment.apiUrl}/PublicStatistics`;


  constructor(
    private http: HttpClient
  ) {}


  // =========================================================
  // AKTIVNA TAKMIČENJA
  // =========================================================

  getActiveCompetitions():
    Observable<PublicCompetitionOption[]> {

    return this.http.get<
      PublicCompetitionOption[]
    >(
      `${this.apiUrl}/competitions`
    );
  }


  // =========================================================
  // STATISTIKA
  // =========================================================

  getStatistics(
    competitionId: number
  ): Observable<PublicStatisticsResponse> {

    const params =
      new HttpParams()
        .set(
          'competitionId',
          competitionId
        );

    return this.http.get<
      PublicStatisticsResponse
    >(
      this.apiUrl,
      { params }
    );
  }
}