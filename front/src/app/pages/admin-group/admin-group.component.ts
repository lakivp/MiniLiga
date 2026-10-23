import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AdminGroupService,
  AdminGroup,
  AdminGroupTeam,
  AdminGroupTeamOption,
  GroupStanding,
  GroupMatch
} from '../../services/admin-group.service';

import {
  AdminCompetitionService
} from '../../services/admin-competition.service';

import {
  AdminMatchService
} from '../../services/admin-match.service';


@Component({
  selector: 'app-admin-group',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './admin-group.component.html',

  styleUrl: './admin-group.component.css'
})
export class AdminGroupComponent implements OnInit {

  // =========================================================
  // ID
  // =========================================================
  matches: GroupMatch[] = [];
  matchesLoading = false;
  selectedRound: number | null = null;
  groupId = 0;


  // =========================================================
  // DATA
  // =========================================================

  group: AdminGroup | null = null;

  teams: AdminGroupTeam[] = [];

  allTeams: AdminGroupTeamOption[] = [];

  standings: GroupStanding[] = [];


  // =========================================================
  // UI STATE
  // =========================================================

  loading = true;

  standingsLoading = false;

  saving = false;

  error = '';

  success = '';

  showAddTeamForm = false;

  teamToRemove: AdminGroupTeam | null = null;

  matchToDelete: GroupMatch | null = null;

  deletingMatch = false;


  // =========================================================
  // FORM
  // =========================================================

  selectedTeamId: number | null = null;

  selectedSeed: number | null = null;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: AdminGroupService,
    private competitionService: AdminCompetitionService,
    private matchService: AdminMatchService
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!id || id <= 0) {

      this.error = 'ID grupe nije validan.';

      this.loading = false;

      return;
    }

    this.groupId = id;

    this.loadData();
  }


  // =========================================================
  // LOAD DATA
  // =========================================================

 loadData(): void {
  this.loading = true;
  this.clearMessages();

  this.groupService
    .getGroup(this.groupId)
    .subscribe({
      next: (group: AdminGroup) => {
        this.group = group;

        this.loadTeams();
        this.loadStandings();
        this.loadMatches();
      },

      error: (err: HttpErrorResponse) => {
        console.error(
          'Greška pri učitavanju grupe:',
          err
        );

        this.error =
          err.error?.message ??
          'Greška pri učitavanju grupe.';

        this.loading = false;
      }
    });
}


loadMatches(): void {
  this.matchesLoading = true;

  this.groupService
    .getGroupMatches(this.groupId)
    .subscribe({
      next: (matches: GroupMatch[]) => {
        this.matches = matches;
        this.selectedRound = this.matchRounds.at(-1) ?? null;
        this.matchesLoading = false;
      },

      error: (err: HttpErrorResponse) => {
        console.error(
          'Greška pri učitavanju utakmica:',
          err
        );

        this.matches = [];
        this.matchesLoading = false;

        this.error =
          err.error?.message ??
          'Greška pri učitavanju utakmica.';
      }
    });
}


  // =========================================================
  // LOAD STANDINGS
  // =========================================================

  loadStandings(): void {

    this.standingsLoading = true;

    this.groupService
      .getGroupStandings(this.groupId)
      .subscribe({

        next: (standings: GroupStanding[]) => {

          this.standings = standings;

          this.standingsLoading = false;
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri učitavanju tabele:',
            err
          );

          this.standings = [];

          this.standingsLoading = false;

          this.error =
            err.error?.message ??
            'Greška pri učitavanju tabele.';
        }

      });
  }


  // =========================================================
  // LOAD GROUP TEAMS
  // =========================================================

  loadTeams(): void {

    this.groupService
      .getGroupTeams(this.groupId)
      .subscribe({

        next: (teams: AdminGroupTeam[]) => {

          this.teams = teams;

          this.loading = false;
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri učitavanju timova:',
            err
          );

          this.error =
            err.error?.message ??
            'Greška pri učitavanju timova.';

          this.loading = false;
        }

      });
  }


  // =========================================================
  // LOAD ALL TEAMS
  // =========================================================

  loadAllTeams(): void {

    this.groupService
      .getAllTeams()
      .subscribe({

        next: (teams: AdminGroupTeamOption[]) => {

          this.allTeams = teams;
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri učitavanju svih timova:',
            err
          );

          this.error =
            err.error?.message ??
            'Greška pri učitavanju timova.';
        }

      });
  }


  // =========================================================
  // GROUP NAME
  // =========================================================

  getGroupName(): string {

    return this.group?.name ?? 'Grupa';
  }


  // =========================================================
  // PHASE NAME
  // =========================================================

  getPhaseName(): string {

    return this.group?.phaseName ?? 'Faza';
  }

  // =========================================================
  // SELECTED TEAM NAME
  // =========================================================

  getSelectedTeamName(): string {

    if (!this.selectedTeamId) {
      return '';
    }

    const team = this.allTeams.find(
      x => x.id === this.selectedTeamId
    );

    return team?.name ?? '';
  }


  // =========================================================
  // AVAILABLE TEAMS
  // =========================================================

  getAvailableTeams(): AdminGroupTeamOption[] {

    const existingTeamIds = new Set(
      this.teams.map(team => team.teamId)
    );

    return this.allTeams.filter(
      team =>
        team.isActive &&
        !existingTeamIds.has(team.id)
    );
  }


  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  clearMessages(): void {

    this.error = '';

    this.success = '';
  }


  // =========================================================
  // OPEN ADD TEAM
  // =========================================================

  openAddTeam(): void {

    this.clearMessages();

    this.selectedTeamId = null;

    this.selectedSeed = null;

    this.loadAllTeams();

    this.showAddTeamForm = true;
  }


  // =========================================================
  // CANCEL ADD TEAM
  // =========================================================

  cancelAddTeam(): void {

    this.showAddTeamForm = false;

    this.selectedTeamId = null;

    this.selectedSeed = null;
  }


  // =========================================================
  // ADD TEAM
  // =========================================================

  addTeam(): void {

    this.clearMessages();

    if (!this.selectedTeamId) {

      this.error =
        'Morate izabrati tim.';

      return;
    }

    if (
      this.selectedSeed !== null &&
      this.selectedSeed !== undefined &&
      this.selectedSeed <= 0
    ) {

      this.error =
        'Seed mora biti veći od 0.';

      return;
    }

    const teamId = this.selectedTeamId;

    this.saving = true;

    this.groupService
      .addTeam(
        this.groupId,
        {
          teamId: teamId,
          seed: this.selectedSeed
        }
      )
      .subscribe({

        next: () => {

          this.success =
            'Tim je uspešno dodat u grupu.';

          this.saving = false;

          this.cancelAddTeam();

          this.loadTeams();

          this.loadStandings();

          if (this.group) {

            this.group.teamsCount =
              this.group.teamsCount + 1;
          }
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri dodavanju tima:',
            err
          );

          this.error =
            err.error?.message ??
            'Greška pri dodavanju tima.';

          this.saving = false;
        }

      });
  }


  // =========================================================
  // UPDATE SEED
  // =========================================================

  adjustSelectedSeed(change: number): void {

    if (this.saving) {
      return;
    }

    this.selectedSeed = Math.max(
      1,
      (this.selectedSeed ?? 0) + change
    );
  }

  adjustSeed(
    team: AdminGroupTeam,
    change: number
  ): void {

    if (this.saving) {
      return;
    }

    team.seed = Math.max(
      1,
      (team.seed ?? 0) + change
    );

    this.updateSeed(team);
  }

  updateSeed(
    team: AdminGroupTeam
  ): void {

    this.clearMessages();

    if (
      team.seed !== null &&
      team.seed !== undefined &&
      team.seed <= 0
    ) {

      this.error =
        'Seed mora biti veći od 0.';

      this.loadTeams();

      return;
    }

    this.saving = true;

    this.groupService
      .updateSeed(
        team.id,
        {
          seed:
            team.seed === null ||
            team.seed === undefined ||
            team.seed === 0
              ? null
              : team.seed
        }
      )
      .subscribe({

        next: () => {

          this.success =
            `Seed za tim "${team.teamName}" je ažuriran.`;

          this.saving = false;
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri izmeni seeda:',
            err
          );

          this.error =
            err.error?.message ??
            'Greška pri izmeni seeda.';

          this.saving = false;

          this.loadTeams();
        }

      });
  }


  // =========================================================
  // REMOVE TEAM
  // =========================================================

  removeTeam(
    team: AdminGroupTeam
  ): void {

    this.clearMessages();

    this.teamToRemove = team;
  }


  cancelRemoveTeam(): void {

    if (this.saving) {
      return;
    }

    this.teamToRemove = null;
  }


  confirmRemoveTeam(): void {

    if (!this.teamToRemove || this.saving) {
      return;
    }

    const team = this.teamToRemove;

    this.saving = true;

    this.groupService
      .removeTeam(team.id)
      .subscribe({

        next: () => {

          this.success =
            `Tim "${team.teamName}" je uklonjen iz grupe.`;

          this.saving = false;

          this.teamToRemove = null;

          this.loadTeams();

          this.loadStandings();

          if (this.group) {

            this.group.teamsCount =
              Math.max(
                0,
                this.group.teamsCount - 1
              );
          }
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri uklanjanju tima:',
            err
          );

          this.error =
            err.error?.message ??
            'Greška pri uklanjanju tima.';

          this.saving = false;

          this.teamToRemove = null;
        }

      });
  }


  // =========================================================
  // NAVIGATION - PHASE
  // =========================================================

  openPhase(): void {

    if (!this.group) {
      return;
    }

    this.router.navigate([
      '/admin/takmicenje',
      this.group.phaseId
    ]);
  }


  // =========================================================
  // NAVIGATION - COMPETITION
  // =========================================================

  goBackToCompetition(): void {

    if (!this.group) {
      return;
    }

    this.competitionService
      .getPhase(this.group.phaseId)
      .subscribe({

        next: phase => {

          this.router.navigate([
            '/admin/takmicenje',
            phase.competitionId
          ]);
        },

        error: (err: HttpErrorResponse) => {

          console.error(
            'Greška pri pronalaženju takmičenja:',
            err
          );

          // Ako API ne uspe,
          // vrati korisnika na listu takmičenja.
          this.router.navigate([
            '/admin/takmicenja'
          ]);
        }

      });
  }

  openMatch(matchId: number): void {
  this.router.navigate([
    '/admin/utakmica',
    matchId
  ]);
}

  requestDeleteMatch(
    event: MouseEvent,
    match: GroupMatch
  ): void {

    event.stopPropagation();

    if (!this.canDeleteMatch(match) || this.deletingMatch) {
      return;
    }

    this.clearMessages();
    this.matchToDelete = match;
  }

  cancelDeleteMatch(): void {

    if (this.deletingMatch) {
      return;
    }

    this.matchToDelete = null;
  }

  confirmDeleteMatch(): void {

    const match = this.matchToDelete;

    if (!match || !this.canDeleteMatch(match) || this.deletingMatch) {
      return;
    }

    this.deletingMatch = true;

    this.matchService.deleteMatch(match.id).subscribe({

      next: () => {

        this.matches = this.matches.filter(
          item => item.id !== match.id
        );

        if (
          this.selectedRound !== null &&
          !this.matches.some(
            item => item.round === this.selectedRound
          )
        ) {
          this.selectedRound = this.matchRounds.at(-1) ?? null;
        }

        if (this.group) {
          this.group.matchesCount = Math.max(
            0,
            this.group.matchesCount - 1
          );
        }

        this.success = 'Zakazana utakmica je uspešno obrisana.';
        this.matchToDelete = null;
        this.deletingMatch = false;
      },

      error: (err: HttpErrorResponse) => {

        console.error('Greška pri brisanju utakmice:', err);

        this.error = err.error?.message
          ?? 'Zakazanu utakmicu nije moguće obrisati.';

        this.matchToDelete = null;
        this.deletingMatch = false;
      }
    });
  }

createMatch(): void {
  this.router.navigate(
    ['/admin/utakmice/nova'],
    {
      queryParams: {
        groupId: this.groupId
      }
    }
  );
}

getMatchStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Zakazana';

    case 1:
      return 'Uživo';

    case 2:
      return 'Završena';

    case 3:
      return 'Odložena';

    case 4:
      return 'Otkazana';

    default:
      return 'Nepoznato';
  }
}

get matchRounds(): number[] {
  return Array.from(
    new Set(
      this.matches
        .map(match => match.round)
        .filter((round): round is number => round !== null)
    )
  ).sort((firstRound, secondRound) => firstRound - secondRound);
}

get filteredMatches(): GroupMatch[] {
  if (this.selectedRound === null) {
    return this.matches;
  }

  return this.matches.filter(
    match => match.round === this.selectedRound
  );
}

hasMatchStarted(match: GroupMatch): boolean {
  return match.isLive || match.status === 1 || match.status === 2;
}

  canDeleteMatch(match: GroupMatch): boolean {
    return match.status === 0 && !match.isLive;
  }

getMatchStatusClass(status: number): string {
  switch (status) {
    case 1:
      return 'live';

    case 2:
      return 'finished';

    case 3:
      return 'postponed';

    case 4:
      return 'cancelled';

    default:
      return 'scheduled';
  }
}

formatMatchDate(date: string): string {
  const value = new Date(date);

  return value.toLocaleDateString(
    'sr-RS',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}

formatMatchTime(date: string): string {
  const value = new Date(date);

  return value.toLocaleTimeString(
    'sr-RS',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}



}
