import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  FormsModule
} from '@angular/forms';

import {
  AdminMatch,
  AdminMatchService,
  AdminMatchTeam
} from '../../services/admin-match.service';

import {
  AdminCompetition,
  AdminCompetitionService
} from '../../services/admin-competition.service';

import {
  forkJoin
} from 'rxjs';

@Component({
  selector: 'app-admin-matches',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl:
    './admin-matches.component.html',
  styleUrl:
    './admin-matches.component.css'
})
export class AdminMatchesComponent
  implements OnInit {

  matches: AdminMatch[] = [];

  competitions: AdminCompetition[] = [];

  selectedCompetitionId: number | null = null;
  selectedPhaseId: number | null = null;

  private allMatches: AdminMatch[] = [];

  private readonly competitionIdByPhaseId =
    new Map<number, number>();

  readonly pageSize = 9;

  currentPage = 1;

  loading = true;

  error = '';

  searchTerm = '';

  selectedStatus = 'all';

  selectedRound = 'all';

  phaseFilterId: number | null = null;

  phaseFilterName = '';

  ngOnInit(): void {

    const phaseId = Number(
      this.route.snapshot.queryParamMap.get('phaseId')
    );

    if (Number.isInteger(phaseId) && phaseId > 0) {
      this.phaseFilterId = phaseId;
      this.phaseFilterName =
        this.route.snapshot.queryParamMap.get('phaseName')?.trim() ?? '';
    }

    this.loadMatches();
  }

  constructor(
    private matchService: AdminMatchService,
    private competitionService: AdminCompetitionService,
    private route: ActivatedRoute
  ) {}

  loadMatches(): void {

    this.loading = true;

    this.error = '';

    forkJoin({
      matches: this.matchService.getAll(),
      competitions: this.competitionService.getCompetitions(),
      phases: this.matchService.getPhases()
    })
      .subscribe({

        next: ({ matches, competitions, phases }) => {

          this.competitions = competitions.filter(
            competition => competition.isActive
          );
          this.phases = phases;

          this.competitionIdByPhaseId.clear();

          phases.forEach(phase => {
            this.competitionIdByPhaseId.set(
              phase.id,
              phase.competitionId
            );
          });

          this.allMatches = matches.sort(
            (a, b) =>
              new Date(a.matchDate).getTime() -
              new Date(b.matchDate).getTime()
          );

          this.setInitialCompetition();

          this.applyCompetitionAndPhaseFilters();

          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja utakmica.';

          this.loading = false;
        }
      });
  }

  onCompetitionChange(): void {

    this.selectedRound = 'all';

    this.currentPage = 1;

    this.applyCompetitionAndPhaseFilters();
  }

  private setInitialCompetition(): void {

    const selectedCompetitionStillExists =
      this.selectedCompetitionId !== null &&
      this.competitions.some(
        competition =>
          competition.id === this.selectedCompetitionId
      );

    if (selectedCompetitionStillExists) {
      return;
    }

    const competitionIdFromPhase =
      this.phaseFilterId === null
        ? null
        : this.competitionIdByPhaseId.get(
            this.phaseFilterId
          ) ?? null;

    const phaseCompetitionExists =
      competitionIdFromPhase !== null &&
      this.competitions.some(
        competition =>
          competition.id === competitionIdFromPhase
      );

    this.selectedCompetitionId =
      phaseCompetitionExists
        ? competitionIdFromPhase
        : this.competitions[0]?.id ?? null;
    this.selectLeaguePhase();
  }

  private applyCompetitionAndPhaseFilters(): void {
    this.matches = this.allMatches.filter(match =>
      this.selectedCompetitionId !== null &&
      this.competitionIdByPhaseId.get(match.phaseId) ===
        this.selectedCompetitionId &&
      (
        this.selectedPhaseId === null ||
        match.phaseId === this.selectedPhaseId
      )
    );

    this.currentPage = 1;

    this.selectedRound = 'all';

    this.currentPage = Math.min(
      this.currentPage,
      Math.max(1, this.totalPages)
    );
  }

  get filteredMatches(): AdminMatch[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.matches.filter(match => {

      const home =
        match.homeTeam?.name
          ?.toLowerCase() ?? '';

      const away =
        match.awayTeam?.name
          ?.toLowerCase() ?? '';

      const location =
        match.location
          ?.toLowerCase() ?? '';

      const matchesSearch =
        !search ||
        home.includes(search) ||
        away.includes(search) ||
        location.includes(search);

      const matchesStatus =
        this.selectedStatus === 'all' ||
        String(match.status) ===
          this.selectedStatus;

      const matchesRound =
        this.selectedRound === 'all' ||
        String(match.round) ===
          this.selectedRound;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRound
      );
    });
  }

  get totalPages(): number {

    return Math.ceil(
      this.filteredMatches.length / this.pageSize
    );
  }

  get paginatedMatches(): AdminMatch[] {

    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredMatches.slice(
      start,
      start + this.pageSize
    );
  }


  get visiblePageNumbers(): number[] {
    const total = this.totalPages;

    if (total <= 3) {
      return Array.from(
        { length: total },
        (_, index) => index + 1
      );
    }

    if (this.currentPage <= 2) {
      return [1, 2, 3];
    }

    if (this.currentPage >= total - 1) {
      return [total - 2, total - 1, total];
    }

    return [
      this.currentPage - 1,
      this.currentPage,
      this.currentPage + 1
    ];
  }


  get firstVisibleMatch(): number {

    return this.filteredMatches.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastVisibleMatch(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredMatches.length
    );
  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  get rounds(): number[] {

    return Array.from(
      new Set(
        this.matches
          .map(x => x.round)
          .filter(
            (round): round is number =>
              round !== null
          )
      )
    ).sort(
      (a, b) => a - b
    );
  }

  get scheduledCount(): number {

    return this.matches.filter(
      x => x.status === 0
    ).length;
  }

  get liveCount(): number {

    return this.matches.filter(
      x => x.status === 1 || x.isLive
    ).length;
  }

  get finishedCount(): number {

    return this.matches.filter(
      x => x.status === 2
    ).length;
  }

  getMatchStatusClass(
    match: AdminMatch
  ): string {

    if (match.isLive || match.status === 1) {
      return 'live';
    }

    switch (match.status) {

      case 0:
        return 'scheduled';

      case 2:
        return 'finished';

      case 3:
        return 'postponed';

      case 4:
        return 'cancelled';

      default:
        return '';
    }
  }

  getMatchStatusText(
    match: AdminMatch
  ): string {

    if (match.isLive || match.status === 1) {
      return 'UŽIVO';
    }

    switch (match.status) {

      case 0:
        return 'ZAKAZANO';

      case 2:
        return 'ZAVRŠENO';

      default:
        return 'NEPOZNATO';
    }
  }

  getTeamName(
    team: AdminMatchTeam | null
  ): string {

    return team?.name ?? 'TBD';
  }

  getTeamLogo(
    team: AdminMatchTeam | null
  ): string | null {

    return team?.logoUrl ?? null;
  }

  getTeamInitial(
    team: AdminMatchTeam | null
  ): string {

    return team?.name?.charAt(0)
      .toUpperCase() ?? '?';
  }

  formatDate(
    date: string
  ): string {

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(
      new Date(date)
    );
  }

  formatTime(
    date: string
  ): string {

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(
      new Date(date)
    );
  }

  isSameDay(
    first: string,
    second: string
  ): boolean {

    const a =
      new Date(first);

    const b =
      new Date(second);

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  getDayLabel(
    date: string
  ): string {

    const value =
      new Date(date);

    const today =
      new Date();

    const tomorrow =
      new Date();

    tomorrow.setDate(
      today.getDate() + 1
    );

    if (
      this.isSameDay(
        date,
        today.toISOString()
      )
    ) {
      return 'DANAS';
    }

    if (
      this.isSameDay(
        date,
        tomorrow.toISOString()
      )
    ) {
      return 'SUTRA';
    }

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    ).format(value);
  }

  trackByMatch(
    index: number,
    match: AdminMatch
  ): number {

    return match.id;
  }

  phases: {
    id: number;
    name: string;
    competitionId: number;
    type: number;
  }[] = [];

  get availablePhases() {
    if (this.selectedCompetitionId === null) {
      return [];
    }

    return this.phases
      .filter(phase => phase.competitionId === this.selectedCompetitionId)
      .sort((a, b) => a.id - b.id);
  }

  private selectLeaguePhase(): void {
    const leaguePhase = this.availablePhases.find(
      phase =>
        phase.type === 0
    );

    this.selectedPhaseId = leaguePhase?.id ?? null;
  }

  onPhaseChange(): void {
    this.selectedRound = 'all';
    this.currentPage = 1;
    this.applyCompetitionAndPhaseFilters();
  }

  get isKnockoutPhase(): boolean {
    const phase = this.phases?.find(
      p => p.id === this.selectedPhaseId
    );

    return phase?.type === 3 || false;
  }

}
