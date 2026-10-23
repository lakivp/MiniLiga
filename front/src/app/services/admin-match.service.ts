import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';
import { environment } from '../../environments/environment';


// =========================================================
// TEAM
// =========================================================

export interface AdminMatchTeam {

  id: number;

  name: string;

  shortName: string | null;

  logoUrl: string | null;
}


// =========================================================
// MATCH
// =========================================================

export interface AdminMatch {

  id: number;

  phaseId: number;

  phaseName: string;

  groupId: number | null;

  groupName: string | null;

  matchDate: string;

  round: number | null;

  homeScore: number;

  awayScore: number;

  status: number;

  isLive: boolean;

  location: string | null;

  homeTeam: AdminMatchTeam | null;

  awayTeam: AdminMatchTeam | null;
}


// =========================================================
// MATCH PARTICIPANT
// =========================================================

export interface AdminMatchParticipant {

  id: number;

  matchId: number;

  side: number;

  teamId: number | null;

  teamName: string | null;

  teamLogoUrl: string | null;

  sourceType: number;

  sourceMatchId: number | null;

  sourceGroupId: number | null;

  sourceGroupName: string | null;

  sourcePosition: number | null;
}


// =========================================================
// CREATE MATCH
// =========================================================

export interface CreateMatchRequest {

  phaseId: number;

  groupId: number | null;

  matchDate: string;

  round: number | null;

  location: string | null;

  home: {

    side: number;

    teamId: number;

    sourceType: number;

  };

  away: {

    side: number;

    teamId: number;

    sourceType: number;

  };
}


// =========================================================
// COMPETITION PHASE
// =========================================================

export interface CompetitionPhase {

  id: number;

  competitionId: number;

  name: string;

  order: number;

  type: number;
}


// =========================================================
// CREATED MATCH RESPONSE
// =========================================================

export interface CreatedMatchResponse {

  id: number;

  phaseId: number;

  phaseName: string;

  groupId: number | null;

  groupName: string | null;

  matchDate: string;

  round: number | null;

  homeScore: number;

  awayScore: number;

  status: number;

  location: string | null;

  isLive: boolean;

  startedAt: string | null;

  finishedAt: string | null;

  participants: AdminMatchParticipant[];
}


// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class AdminMatchService {

  private readonly apiUrl =
    `${environment.apiUrl}`;


  constructor(
    private http: HttpClient
  ) {}


  // =======================================================
  // GET ALL MATCHES
  // =======================================================

  getAll(): Observable<AdminMatch[]> {

    return this.http
      .get<any[]>(
        `${this.apiUrl}/Matches`
      )
      .pipe(

        map(matches =>
          matches.map(match =>
            this.mapMatch(match)
          )
        )

      );
  }


  // =======================================================
  // GET TEAMS
  // =======================================================

  getTeams(): Observable<AdminMatchTeam[]> {

    return this.http
      .get<AdminMatchTeam[]>(
        `${this.apiUrl}/Teams`
      );
  }


  // =======================================================
  // GET PHASES
  // =======================================================

  getPhases(): Observable<CompetitionPhase[]> {

    return this.http
      .get<CompetitionPhase[]>(
        `${this.apiUrl}/CompetitionPhases`
      );
  }


  // =======================================================
  // CREATE MATCH
  // =======================================================

  createMatch(
    request: CreateMatchRequest
  ): Observable<CreatedMatchResponse> {

    return this.http.post<CreatedMatchResponse>(
      `${this.apiUrl}/Matches`,
      request
    );
  }


  // =======================================================
  // GET MATCH BY ID
  // =======================================================

  getMatch(
    id: number
  ): Observable<CreatedMatchResponse> {

    return this.http.get<CreatedMatchResponse>(
      `${this.apiUrl}/Matches/${id}`
    );
  }


  // =======================================================
  // DELETE MATCH
  // =======================================================

  deleteMatch(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/Matches/${id}`
    );
  }


  // =======================================================
  // MAP MATCH
  // =======================================================

  private mapMatch(
    match: any
  ): AdminMatch {

    const home =
      match.participants
        ?.find(
          (x: any) =>
            x.side === 0 ||
            x.side === 'Home'
        );

    const away =
      match.participants
        ?.find(
          (x: any) =>
            x.side === 1 ||
            x.side === 'Away'
        );


    return {

      id:
        match.id,

      phaseId:
        match.phaseId,

      phaseName:
        match.phaseName ?? '',

      groupId:
        match.groupId ?? null,

      groupName:
        match.groupName ?? null,

      matchDate:
        match.matchDate,

      round:
        match.round,

      homeScore:
        match.homeScore ?? 0,

      awayScore:
        match.awayScore ?? 0,

      status:
        typeof match.status === 'number'
          ? match.status
          : this.statusToNumber(
              match.status
            ),

      isLive:
        match.isLive ?? false,

      location:
        match.location ?? null,


      // ---------------------------------------------------
      // HOME TEAM
      // ---------------------------------------------------

      homeTeam:

        home?.teamId

          ? {

              id:
                home.teamId,

              name:
                home.teamName ??
                'Nepoznat tim',

              shortName:
                null,

              logoUrl:
                home.teamLogoUrl ?? null

            }

          : null,


      // ---------------------------------------------------
      // AWAY TEAM
      // ---------------------------------------------------

      awayTeam:

        away?.teamId

          ? {

              id:
                away.teamId,

              name:
                away.teamName ??
                'Nepoznat tim',

              shortName:
                null,

              logoUrl:
                away.teamLogoUrl ?? null

            }

          : null

    };
  }


  // =======================================================
  // STATUS -> NUMBER
  // =======================================================

  private statusToNumber(
    status: string
  ): number {

    switch (status) {

      case 'Scheduled':
        return 0;

      case 'Live':
        return 1;

      case 'Finished':
        return 2;

      case 'Postponed':
        return 3;

      case 'Cancelled':
        return 4;

      default:
        return 0;
    }
  }

}