
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CompetitionOption,
  PublicResults,
  PublicResultsService,
  ScheduleMatch,
  SchedulePhase,
  ScheduleGroup,
  ScheduleMatchSection
} from '../../services/schedule.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent implements OnInit {

  competitions: CompetitionOption[] = [];
  results: PublicResults | null = null;

  loadingCompetitions = false;
  loadingSchedule = false;
  errorMessage = '';

  selectedCompetitionId: number | null = null;
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  selectedRound: number | null = null;

  constructor(
    private resultsService: PublicResultsService
  ) {}

  ngOnInit(): void {
    this.loadCompetitions();
  }

  // =====================================================
  // UČITAVANJE TAKMIČENJA
  // =====================================================

  loadCompetitions(): void {
    this.loadingCompetitions = true;
    this.errorMessage = '';

    this.resultsService.getCompetitions().subscribe({
      next: (competitions) => {
        this.competitions = [...(competitions ?? [])]
          .sort((a, b) => a.id - b.id);

        this.loadingCompetitions = false;

        if (this.competitions.length > 0) {
          this.selectedCompetitionId = this.competitions[0].id;
          this.loadSchedule();
        } else {
          this.selectedCompetitionId = null;
          this.results = null;
        }
      },
      error: (error) => {
        console.error('Greška pri učitavanju takmičenja:', error);

        this.loadingCompetitions = false;
        this.errorMessage = 'Nije moguće učitati takmičenja.';
      }
    });
  }

  // =====================================================
  // UČITAVANJE RASPOREDA
  // =====================================================

  loadSchedule(): void {
    if (this.selectedCompetitionId === null) {
      this.results = null;
      return;
    }

    this.loadingSchedule = true;
    this.errorMessage = '';

    this.selectedPhaseId = null;
    this.selectedGroupId = null;
    this.selectedRound = null;

    this.resultsService.getResults(this.selectedCompetitionId).subscribe({
      next: (response) => {
        this.results = response;
        this.loadingSchedule = false;

        if (this.phases.length > 0) {
          this.selectedPhaseId = this.phases[0].id;
          this.onPhaseChange();
        }
      },
      error: (error) => {
        console.error('Greška pri učitavanju rasporeda:', error);

        this.loadingSchedule = false;
        this.results = null;
        this.errorMessage = 'Nije moguće učitati raspored utakmica.';
      }
    });
  }

  onCompetitionChange(): void {
    this.loadSchedule();
  }

  onPhaseChange(): void {
    this.selectedGroupId = null;
    this.selectedRound = null;

    if (this.isKnockoutSelected) {
      return;
    }

    const groups = this.availableGroups;

    if (groups.length > 0) {
      this.selectedGroupId = groups[0].id;
    }

    this.selectLastRound();
  }
  onGroupChange(): void {
    this.selectLastRound();
  }
  selectLastRound(): void {
    if (this.isKnockoutSelected) {
      this.selectedRound = null;
      return;
    }

    const rounds = this.availableRounds;

    this.selectedRound = rounds.length > 0
      ? Math.max(...rounds)
      : null;
  }
  // =====================================================
  // FAZE
  // =====================================================

  get phases(): SchedulePhase[] {
    return this.results?.phases ?? [];
  }

  get selectedPhase(): SchedulePhase | null {
    if (this.selectedPhaseId === null) {
      return null;
    }

    return this.phases.find(
      phase => phase.id === this.selectedPhaseId
    ) ?? null;
  }

  /**
   * Backend PhaseType:
   * League = 0
   * Groups = 1
   * Playoff = 2
   * Knockout = 3
   * Custom = 4
   */
  isKnockoutPhase(phase: SchedulePhase | null): boolean {
    return phase !== null && Number(phase.type) === 3;
  }

  get isKnockoutSelected(): boolean {
    return this.isKnockoutPhase(this.selectedPhase);
  }

  get filteredPhases(): SchedulePhase[] {
    if (this.selectedPhaseId === null) {
      return this.phases;
    }

    return this.phases.filter(
      phase => phase.id === this.selectedPhaseId
    );
  }

  // =====================================================
  // GRUPE
  // =====================================================

  get availableGroups(): ScheduleGroup[] {
    if (this.isKnockoutSelected) {
      return [];
    }

    return this.filteredPhases
      .filter(phase => !this.isKnockoutPhase(phase))
      .flatMap(phase => phase.groups ?? []);
  }

  // =====================================================
  // KOLA
  // =====================================================

  get availableRounds(): number[] {
    if (this.isKnockoutSelected) {
      return [];
    }

    const rounds = this.filteredPhases
      .filter(phase => !this.isKnockoutPhase(phase))
      .flatMap(phase => phase.rounds ?? []);

    return [...new Set(rounds)]
      .sort((a, b) => a - b);
  }

  // =====================================================
  // STATUS UTAKMICE
  // =====================================================

  /**
   * Backend MatchStatus:
   * Scheduled = 0
   * Live = 1
   * Finished = 2
   * Postponed = 3
   * Cancelled = 4
   *
   * PublicResultsService šalje Status.ToString(),
   * tako da proveravamo tekst "Scheduled".
   */
  private isScheduled(match: ScheduleMatch): boolean {
    const status = String(match.status ?? '')
      .trim()
      .toLowerCase();

    return status === 'scheduled';
  }

  // =====================================================
  // DOBAVLJANJE UTAKMICA
  // =====================================================

  /**
   * Backend sve utakmice vraća kroz groups.
   * Kod Knockout faze postoji jedna grupa:
   * Id = null, Name = "Utakmice".
   */
  private getPhaseMatches(phase: SchedulePhase): ScheduleMatch[] {
    return (phase.groups ?? [])
      .flatMap(group => group.matches ?? []);
  }

  /**
   * Vraća sve zakazane utakmice u trenutno izabranim fazama.
   */
  getAllMatchesForFilters(): ScheduleMatch[] {
    let matches: ScheduleMatch[] = [];

    for (const phase of this.filteredPhases) {
      matches.push(...this.getPhaseMatches(phase));
    }

    matches = matches.filter(match => this.isScheduled(match));

    // Filter grupe se primenjuje samo van nokaut faze.
    if (this.selectedGroupId !== null && !this.isKnockoutSelected) {
      const selectedPhase = this.selectedPhase;

      if (selectedPhase) {
        const selectedGroup = (selectedPhase.groups ?? []).find(
          group => group.id === this.selectedGroupId
        );

        const allowedIds = new Set(
          (selectedGroup?.matches ?? []).map(match => match.id)
        );

        matches = matches.filter(
          match => allowedIds.has(match.id)
        );
      }
    }

    // Filter kola se primenjuje samo van nokaut faze.
    if (this.selectedRound !== null && !this.isKnockoutSelected) {
      matches = matches.filter(
        match => match.round === this.selectedRound
      );
    }

    return matches.sort(
      (a, b) =>
        new Date(a.matchDate).getTime() -
        new Date(b.matchDate).getTime()
    );
  }

  // =====================================================
  // UKUPAN BROJ UTAKMICA
  // =====================================================

  get totalMatches(): number {
    return this.getAllMatchesForFilters().length;
  }

  // =====================================================
  // SEKCIJE RASPOREDA
  // =====================================================

  get scheduleSections(): ScheduleMatchSection[] {
    const sections: ScheduleMatchSection[] = [];

    for (const phase of this.filteredPhases) {

      // -------------------------------------------------
      // NOKAUT FAZA
      // -------------------------------------------------

      if (this.isKnockoutPhase(phase)) {
        const matches = this.getPhaseMatches(phase)
          .filter(match => this.isScheduled(match))
          .sort(
            (a, b) =>
              new Date(a.matchDate).getTime() -
              new Date(b.matchDate).getTime()
          );

        if (matches.length > 0) {
          sections.push({
            phaseName: phase.name,
            phaseType: phase.type,
            groupName: 'Nokaut faza',
            round: null,
            matches
          });
        }

        continue;
      }

      // -------------------------------------------------
      // LIGAŠKA / PLAYOFF / OSTALE FAZE
      // -------------------------------------------------

      let groups = phase.groups ?? [];

      if (this.selectedGroupId !== null) {
        groups = groups.filter(
          group => group.id === this.selectedGroupId
        );
      }

      for (const group of groups) {
        let matches = (group.matches ?? [])
          .filter(match => this.isScheduled(match));

        if (this.selectedRound !== null) {
          matches = matches.filter(
            match => match.round === this.selectedRound
          );
        }

        // Grupisanje po kolima.
        const rounds = new Map<string, ScheduleMatch[]>();

        for (const match of matches) {
          const roundKey =
            match.round !== null && match.round !== undefined
              ? String(match.round)
              : 'other';

          if (!rounds.has(roundKey)) {
            rounds.set(roundKey, []);
          }

          rounds.get(roundKey)!.push(match);
        }

        // Sortiranje kola.
        const sortedRounds = [...rounds.entries()].sort((a, b) => {
          if (a[0] === 'other') {
            return 1;
          }

          if (b[0] === 'other') {
            return -1;
          }

          return Number(a[0]) - Number(b[0]);
        });

        // Kreiranje sekcija.
        for (const [roundKey, roundMatches] of sortedRounds) {
          sections.push({
            phaseName: phase.name,
            phaseType: phase.type,
            groupName: group.name,
            round: roundKey === 'other'
              ? null
              : Number(roundKey),
            matches: [...roundMatches].sort(
              (a, b) =>
                new Date(a.matchDate).getTime() -
                new Date(b.matchDate).getTime()
            )
          });
        }
      }
    }

    return sections;
  }

  // =====================================================
  // TIMOVI
  // =====================================================

  getTeamName(team: ScheduleMatch['homeTeam']): string {
    if (!team?.isResolved) {
      return team?.name || 'TBD';
    }

    return team.name || 'Nepoznat tim';
  }

  getTeamInitials(team: ScheduleMatch['homeTeam']): string {
    const name = this.getTeamName(team);

    if (name === 'TBD') {
      return '?';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  getTeamLogoUrl(
    logoUrl: string | null | undefined
  ): string | null {
    if (!logoUrl) {
      return null;
    }

    if (
      logoUrl.startsWith('http://') ||
      logoUrl.startsWith('https://')
    ) {
      return logoUrl;
    }

      return `${environment.apiUrl.replace('/api', '')}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
  }

  // =====================================================
  // DATUM I VREME
  // =====================================================

  getMatchTime(matchDate: string): string {
    const date = new Date(matchDate);

    if (isNaN(date.getTime())) {
      return '--:--';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Belgrade'
    }).format(date);
  }

  getMatchDate(matchDate: string): string {
    const date = new Date(matchDate);

    if (isNaN(date.getTime())) {
      return 'Nepoznat datum';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Belgrade'
    }).format(date);
  }

  getDayNumber(matchDate: string): string {
    const date = new Date(matchDate);

    if (isNaN(date.getTime())) {
      return '--';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      timeZone: 'Europe/Belgrade'
    }).format(date);
  }

  getMonthShort(matchDate: string): string {
    const date = new Date(matchDate);

    if (isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      month: 'short',
      timeZone: 'Europe/Belgrade'
    }).format(date)
      .replace('.', '')
      .toUpperCase();
  }

  // =====================================================
  // POMOĆNE METODE
  // =====================================================

  trackByMatch(
    index: number,
    match: ScheduleMatch
  ): number {
    return match.id;
  }

  resetFilters(): void {
    const lastPhase = this.phases[0];

    if (!lastPhase) {
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.selectedRound = null;
      return;
    }

    this.selectedPhaseId = lastPhase.id;

    if (this.isKnockoutPhase(lastPhase)) {
      this.selectedGroupId = null;
      this.selectedRound = null;
      return;
    }

    const firstGroup = lastPhase.groups?.[0];

    this.selectedGroupId = firstGroup?.id ?? null;

    const rounds = lastPhase.rounds ?? [];
    this.selectedRound = rounds.length > 0
      ? Math.max(...rounds)
      : null;
  }
}