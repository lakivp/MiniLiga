import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminGroupTeam {
id: number;
groupId: number;
teamId: number;
teamName: string;
shortName: string | null;
logoUrl: string | null;
seed: number | null;
}

export interface AddGroupTeamRequest {
teamId: number;
seed: number | null;
}

export interface UpdateGroupTeamSeedRequest {
seed: number | null;
}

export interface AdminGroup {
id: number;
phaseId: number;
phaseName: string;
name: string;
order: number;
teamsCount: number;
matchesCount: number;
}

export interface AdminGroupTeamOption {
id: number;
name: string;
shortName: string | null;
logoUrl: string | null;
primaryColor: string | null;
secondaryColor: string | null;
isActive: boolean;
}

export interface GroupStanding {
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

export interface GroupMatchTeam {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

export interface GroupMatch {
  id: number;
  groupId: number;
  phaseId: number;

  matchDate: string;

  round: number | null;

  homeScore: number;
  awayScore: number;

  status: number;

  isLive: boolean;

  location: string | null;

  homeTeam: GroupMatchTeam | null;
  awayTeam: GroupMatchTeam | null;
}

@Injectable({
providedIn: 'root'
})
export class AdminGroupService {

private readonly apiUrl =
`${environment.apiUrl}`;

constructor(
private http: HttpClient
) {}

// =========================================================
// GROUP
// =========================================================

getGroup(
id: number
): Observable<AdminGroup> {


return this.http.get<AdminGroup>(
  `${this.apiUrl}/CompetitionGroups/${id}`
);


}

// =========================================================
// TEAMS IN GROUP
// =========================================================

getGroupTeams(
groupId: number
): Observable<AdminGroupTeam[]> {


return this.http.get<AdminGroupTeam[]>(
  `${this.apiUrl}/GroupTeams/group/${groupId}`
);


}

// =========================================================
// GROUP STANDINGS
// =========================================================

getGroupStandings(
groupId: number
): Observable<GroupStanding[]> {


return this.http.get<GroupStanding[]>(
  `${this.apiUrl}/Standings/group/${groupId}`
);


}

// =========================================================
// ADD TEAM
// =========================================================

addTeam(
groupId: number,
request: AddGroupTeamRequest
): Observable<AdminGroupTeam> {


return this.http.post<AdminGroupTeam>(
  `${this.apiUrl}/GroupTeams`,
  {
    groupId,
    ...request
  }
);


}

// =========================================================
// UPDATE SEED
// =========================================================

updateSeed(
groupTeamId: number,
request: UpdateGroupTeamSeedRequest
): Observable<void> {


return this.http.put<void>(
  `${this.apiUrl}/GroupTeams/${groupTeamId}/seed`,
  request
);


}

// =========================================================
// REMOVE TEAM
// =========================================================

removeTeam(
groupTeamId: number
): Observable<void> {


return this.http.delete<void>(
  `${this.apiUrl}/GroupTeams/${groupTeamId}`
);


}

// =========================================================
// ALL TEAMS
// =========================================================

  getAllTeams(): Observable<AdminGroupTeamOption[]> {


  return this.http.get<AdminGroupTeamOption[]>(
    `${this.apiUrl}/Teams`
    );


  }

  getGroupMatches(
  groupId: number
    ): Observable<GroupMatch[]> {
      return this.http.get<GroupMatch[]>(
        `${this.apiUrl}/GroupMatches/group/${groupId}`
      );
    }

}
