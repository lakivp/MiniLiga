import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';

export interface AdminCompetition {
  id: number;
  seasonId: number;
  seasonName: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface AdminSeasonOption {
  id: number;
  name: string;
  number: number;
  isActive: boolean;
}

export interface CreateAdminCompetitionRequest {
  seasonId: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateAdminSeasonRequest {
  name: string;
  number: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  description: string | null;
}

export interface CompetitionPhase {
  id: number;
  competitionId: number;
  competitionName: string;
  name: string;
  order: number;
  type: number;
  typeName: string;
  groupsCount: number;
  matchesCount: number;
}

export interface CompetitionGroup {
  id: number;
  phaseId: number;
  phaseName: string;
  name: string;
  order: number;
  teamsCount: number;
  matchesCount: number;
}

export interface CreatePhaseRequest {
  competitionId: number;
  name: string;
  order: number;
  type: number;
}

export interface CreateGroupRequest {
  phaseId: number;
  name: string;
  order: number;
}

export interface GroupTeam {
  id: number;
  groupId: number;
  groupName: string;
  teamId: number;
  teamName: string;
  shortName: string | null;
  logoUrl: string | null;
  seed: number | null;
}

export interface AddGroupTeamRequest {
  groupId: number;
  teamId: number;
  seed: number | null;
}

export interface UpdateGroupTeamRequest {
  seed: number | null;
}

export interface GroupTeam {
  id: number;
  groupId: number;
  teamId: number;
  teamName: string;
  shortName: string | null;
  logoUrl: string | null;
  seed: number | null;
}

export interface AddGroupTeamRequest {
  groupId: number;
  teamId: number;
  seed: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCompetitionService {

  private readonly apiUrl = 
    `${environment.apiUrl}`;

  constructor(
    private http: HttpClient
  ) {}

  getCompetitions(): Observable<AdminCompetition[]> {
    return this.http.get<AdminCompetition[]>(
      `${this.apiUrl}/Competitions`
    );
  }

  getSeasons(): Observable<AdminSeasonOption[]> {
    return this.http.get<AdminSeasonOption[]>(
      `${this.apiUrl}/Seasons`
    );
  }

  createCompetition(
    request: CreateAdminCompetitionRequest
  ): Observable<AdminCompetition> {
    return this.http.post<AdminCompetition>(
      `${this.apiUrl}/Competitions`,
      request
    );
  }

  createSeason(
    request: CreateAdminSeasonRequest
  ): Observable<AdminSeasonOption> {
    return this.http.post<AdminSeasonOption>(
      `${this.apiUrl}/Seasons`,
      request
    );
  }

  updateCompetition(
    id: number,
    request: CreateAdminCompetitionRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/Competitions/${id}`,
      request
    );
  }

  deleteCompetition(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/Competitions/${id}`
    );
  }

  // =========================
  // PHASES
  // =========================

  getPhases(): Observable<CompetitionPhase[]> {
    return this.http.get<CompetitionPhase[]>(
      `${this.apiUrl}/CompetitionPhases`
    );
  }

  getPhase(
    id: number
  ): Observable<CompetitionPhase> {
    return this.http.get<CompetitionPhase>(
      `${this.apiUrl}/CompetitionPhases/${id}`
    );
  }

  createPhase(
    request: CreatePhaseRequest
  ): Observable<CompetitionPhase> {
    return this.http.post<CompetitionPhase>(
      `${this.apiUrl}/CompetitionPhases`,
      request
    );
  }

  updatePhase(
    id: number,
    request: Partial<CreatePhaseRequest>
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/CompetitionPhases/${id}`,
      request
    );
  }

  deletePhase(
    id: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/CompetitionPhases/${id}`
    );
  }


  // =========================
  // GROUPS
  // =========================

  getGroups(): Observable<CompetitionGroup[]> {
    return this.http.get<CompetitionGroup[]>(
      `${this.apiUrl}/CompetitionGroups`
    );
  }

  getGroupsByPhase(
    phaseId: number
  ): Observable<CompetitionGroup[]> {
    return this.http.get<CompetitionGroup[]>(
      `${this.apiUrl}/CompetitionGroups/phase/${phaseId}`
    );
  }

  getGroup(
    id: number
  ): Observable<CompetitionGroup> {
    return this.http.get<CompetitionGroup>(
      `${this.apiUrl}/CompetitionGroups/${id}`
    );
  }

  createGroup(
    request: CreateGroupRequest
  ): Observable<CompetitionGroup> {
    return this.http.post<CompetitionGroup>(
      `${this.apiUrl}/CompetitionGroups`,
      request
    );
  }

  updateGroup(
    id: number,
    request: Partial<CreateGroupRequest>
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/CompetitionGroups/${id}`,
      request
    );
  }

  deleteGroup(
    id: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/CompetitionGroups/${id}`
    );
  }

  getGroupTeams(groupId: number): Observable<GroupTeam[]> {
    return this.http.get<GroupTeam[]>(
      `${this.apiUrl}/GroupTeams/group/${groupId}`
    );
  }

  addTeamToGroup(
    request: AddGroupTeamRequest
  ): Observable<GroupTeam> {
    return this.http.post<GroupTeam>(
      `${this.apiUrl}/GroupTeams`,
      request
    );
  }

  updateGroupTeam(
    id: number,
    seed: number | null
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/GroupTeams/${id}`,
      {
        seed
      }
    );
  }

  removeTeamFromGroup(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/GroupTeams/${id}`
    );
  }

  
}