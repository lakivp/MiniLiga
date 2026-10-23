
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompetitionOption {
  id: number;
  name: string;
}

export interface ScheduleTeam {
  teamId: number | null;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  isResolved: boolean;
}

export interface ScheduleMatch {
  id: number;
  matchDate: string;
  round: number | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  location: string | null;
  homeTeam: ScheduleTeam;
  awayTeam: ScheduleTeam;
}

export interface ScheduleGroup {
  id: number;
  name: string;
  matches: ScheduleMatch[];
}

export interface SchedulePhase {
  id: number;
  name: string;
  type: number;
  order: number;
  rounds: number[];
  groups: ScheduleGroup[];
}

export interface PublicResults {
  competitionId: number;
  competitionName: string;
  phases: SchedulePhase[];
}

export interface ScheduleMatchSection {
  phaseName: string;
  phaseType: number;
  groupName: string;
  round: number | null;
  matches: ScheduleMatch[];
}
@Injectable({
  providedIn: 'root'
})
export class PublicResultsService {
  private readonly apiUrl = `${environment.apiUrl}/PublicResults`;

  constructor(private http: HttpClient) {}

  getCompetitions(): Observable<CompetitionOption[]> {
    return this.http.get<CompetitionOption[]>(
      `${this.apiUrl}/competitions`
    );
  }

  getResults(competitionId: number): Observable<PublicResults> {
    const params = new HttpParams()
      .set('competitionId', competitionId);

    return this.http.get<PublicResults>(
      this.apiUrl,
      { params }
    );
  }
}