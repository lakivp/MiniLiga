import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';
import { environment } from '../../environments/environment';


export interface PublicStandingsCompetition {

  id: number;

  name: string;

  isActive: boolean;
}


export interface PublicStandingTeam {

  position: number;

  teamId: number;

  teamName: string;

  shortName: string | null;

  logoUrl: string | null;

  played: number;

  wins: number;

  draws: number;

  losses: number;

  goalsFor: number;

  goalsAgainst: number;

  goalDifference: number;

  points: number;
}


export interface PublicStandingsTable {

  groupId: number | null;

  groupName: string;

  teams: PublicStandingTeam[];
}


export interface PublicStandingsPhase {

  id: number;

  name: string;

  type: number;

  order: number;

  tables: PublicStandingsTable[];
}


export interface PublicStandingsResponse {

  competitionId: number;

  competitionName: string;

  phases: PublicStandingsPhase[];
}


@Injectable({
  providedIn: 'root'
})
export class PublicStandingsService {

  private readonly apiUrl =
    `${environment.apiUrl}/PublicStandings`;


  constructor(
    private http: HttpClient
  ) {}


  // =========================================================
  // AKTIVNA TAKMIČENJA
  // =========================================================

  getActiveCompetitions():
    Observable<PublicStandingsCompetition[]> {

    return this.http.get<
      PublicStandingsCompetition[]
    >(
      `${this.apiUrl}/competitions`
    );
  }


  // =========================================================
  // TABELA
  // =========================================================

  getStandings(
    competitionId: number
  ): Observable<PublicStandingsResponse> {

    const params =
      new HttpParams()
        .set(
          'competitionId',
          competitionId
        );


    return this.http.get<
      PublicStandingsResponse
    >(
      this.apiUrl,
      {
        params
      }
    );
  }
}