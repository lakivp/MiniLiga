import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


// =========================================================
// COMPETITION
// =========================================================

export interface PublicResultsCompetition {
  id: number;
  name: string;
  isActive: boolean;
}


// =========================================================
// TEAM
// =========================================================

export interface PublicResultTeam {
  teamId: number | null;

  name: string;

  shortName: string | null;

  logoUrl: string | null;

  isResolved: boolean;
}


// =========================================================
// MATCH
// =========================================================

export interface PublicResultMatch {
  id: number;

  matchDate: string;

  round: number | null;

  homeScore: number;

  awayScore: number;

  status: string;

  location: string | null;

  homeTeam: PublicResultTeam;

  awayTeam: PublicResultTeam;
}


// =========================================================
// GROUP
// =========================================================

export interface PublicResultsGroup {
  id: number | null;

  name: string;

  matches: PublicResultMatch[];
}


// =========================================================
// PHASE
// =========================================================

export interface PublicResultsPhase {
  id: number;

  name: string;

  type: number;

  order: number;

  rounds: number[];

  groups: PublicResultsGroup[];
}


// =========================================================
// RESPONSE
// =========================================================

export interface PublicResultsResponse {
  competitionId: number;

  competitionName: string;

  phases: PublicResultsPhase[];
}




// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class PublicResultsService {

  private readonly apiUrl =
    `${environment.apiUrl}/PublicResults`;


  constructor(
    private http: HttpClient
  ) {}


  // =======================================================
  // TAKMIČENJA
  // =======================================================

  getCompetitions():
    Observable<PublicResultsCompetition[]> {

    return this.http.get<
      PublicResultsCompetition[]
    >(
      `${this.apiUrl}/competitions`
    );
  }


  // =======================================================
  // REZULTATI
  // =======================================================

  getResults(
    competitionId: number
  ): Observable<PublicResultsResponse> {

    const params =
      new HttpParams()
        .set(
          'competitionId',
          competitionId
        );


    return this.http.get<
      PublicResultsResponse
    >(
      this.apiUrl,
      {
        params
      }
    );
  }

}