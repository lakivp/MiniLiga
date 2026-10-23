import { CommonModule } from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit,
  NgZone
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import {
  PublicResultsService,
  PublicResultsCompetition,
  PublicResultsResponse,
  PublicResultsPhase,
  PublicResultsGroup,
  PublicResultMatch
} from '../../services/public-results.service';

import {
  PublicLiveMatchService,
  LiveMatchUpdate
} from '../../services/public-live-match.service';

import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-results',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './results.component.html',

  styleUrl: './results.component.css'
})
export class ResultsComponent
  implements OnInit, OnDestroy {

  private liveMatchSubscription?: Subscription;
  private reconnectSubscription?: Subscription;


  // =========================================================
  // DATA
  // =========================================================

  competitions:
    PublicResultsCompetition[] = [];

  results:
    PublicResultsResponse | null = null;
  private resultsRequestId = 0;

  // =========================================================
  // SELECTED FILTERS
  // =========================================================

  selectedCompetitionId:
    number | null = null;

  selectedPhaseId:
    number | null = null;

  selectedRound:
    number | null = null;

  showOnlyLive = false;


  // =========================================================
  // STATE
  // =========================================================

  loadingCompetitions = false;

  loadingResults = false;

  errorMessage = '';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private resultsService:
      PublicResultsService,

    private liveMatchService:
      PublicLiveMatchService,

    private ngZone:
      NgZone
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCompetitions();

    this.startLiveUpdates();

  }


  // =========================================================
  // LIVE UPDATES
  // =========================================================

  private startLiveUpdates(): void {
    this.liveMatchSubscription =
      this.liveMatchService.matchUpdated$.subscribe(update => {
        this.ngZone.run(() => {
          console.log('Primljeno live ažuriranje:', update);
          this.updateLiveMatch(update);
        });
      });

    this.reconnectSubscription =
      this.liveMatchService.reconnected$.subscribe(() => {
        this.ngZone.run(() => {
          this.refreshResultsAfterReconnect();
        });
      });

    void this.liveMatchService.start().catch(error => {
      console.error(
        'Greška prilikom povezivanja na live utakmice:',
        error
      );
    });
  }

  private refreshResultsAfterReconnect(): void {
  const competitionId = this.selectedCompetitionId;

  if (competitionId == null) {
    return;
  }

  this.resultsService.getResults(competitionId).subscribe({
    next: response => {
      this.ngZone.run(() => {
        this.results = response;
        console.log(
          'Rezultati osveženi nakon reconnect-a.'
        );
      });
    },
    error: error => {
      console.error(
        'Greška pri osvežavanju rezultata nakon reconnect-a:',
        error
      );
    }
  });
  }
  // =========================================================
  // JOIN ALL COMPETITION MATCHES
  // =========================================================

  private async joinCompetitionMatches(): Promise<void> {
    if (!this.results) {
      return;
    }

    const matchIds = [
      ...new Set(
        this.results.phases
          .flatMap(phase => phase.groups)
          .flatMap(group => group.matches)
          .map(match => match.id)
      )
    ];

    for (const matchId of matchIds) {
      try {
        await this.liveMatchService.joinMatch(matchId);
      } catch (error) {
        console.error(
          `Greška pri pridruživanju utakmici ${matchId}:`,
          error
        );
      }
    }
  }


  // =========================================================
  // UPDATE LIVE MATCH
  // =========================================================

  private updateLiveMatch(update: LiveMatchUpdate): void {
    if (!this.results) {
      return;
    }

    for (const phase of this.results.phases) {
      for (const group of phase.groups) {
        const match = group.matches.find(
          item => item.id === update.matchId
        );

        if (!match) {
          continue;
        }

        match.homeScore = update.homeScore;
        match.awayScore = update.awayScore;
        match.status = update.status;

        return;
      }
    }
  }


  // =========================================================
  // LOAD COMPETITIONS
  // =========================================================

  loadCompetitions(): void {

    this.loadingCompetitions = true;

    this.errorMessage = '';


    this.resultsService
      .getCompetitions()
      .subscribe({

        next: competitions => {

          this.competitions =
            competitions;

          this.loadingCompetitions =
            false;


          if (
            this.competitions.length === 0
          ) {

            this.errorMessage =
              'Trenutno nema aktivnih takmičenja.';

            return;

          }


          const firstCompetition =
            [...this.competitions]
              .sort(
                (a, b) =>
                  a.id - b.id
              )[0];


          this.selectedCompetitionId =
            firstCompetition.id;


          this.loadResults(
            firstCompetition.id
          );

        },


        error: error => {

          console.error(
            'Greška pri učitavanju takmičenja:',
            error
          );


          this.loadingCompetitions =
            false;


          this.errorMessage =
            error?.error?.message ??
            'Takmičenja trenutno nije moguće učitati.';

        }

      });

  }


  // =========================================================
  // CHANGE COMPETITION
  // =========================================================

  onCompetitionChange(): void {

    this.showOnlyLive = false;


    if (!this.selectedCompetitionId) {
      return;
    }


    this.loadResults(
      this.selectedCompetitionId
    );

  }

  openFilterOptions(
    event: MouseEvent,
    selectId: string
  ): void {

    if (event.target instanceof HTMLSelectElement) {
      return;
    }

    const select = document.getElementById(selectId) as
      HTMLSelectElement | null;

    if (!select || select.disabled) {
      return;
    }

    select.focus();

    const selectWithPicker = select as HTMLSelectElement & {
      showPicker?: () => void;
    };

    if (selectWithPicker.showPicker) {
      selectWithPicker.showPicker();
      return;
    }

    select.click();
  }


  // =========================================================
  // RESET FILTERS
  // =========================================================

  resetFilters(): void {

    if (
      !this.competitions.length
    ) {
      return;
    }


    const firstCompetition =
      [...this.competitions]
        .sort(
          (a, b) =>
            a.id - b.id
        )[0];


    this.showOnlyLive = false;

    this.selectedCompetitionId =
      firstCompetition.id;


    this.loadResults(
      firstCompetition.id
    );

  }


  // =========================================================
  // LOAD RESULTS
  // =========================================================

  loadResults(competitionId: number): void {
    const requestId = ++this.resultsRequestId;

    this.loadingResults = true;
    this.errorMessage = '';
    this.results = null;
    this.selectedPhaseId = null;
    this.selectedRound = null;

    void this.loadResultsAndJoinMatches(competitionId, requestId);
  }

  private async loadResultsAndJoinMatches(
    competitionId: number,
    requestId: number
  ): Promise<void> {
    try {
      await this.liveMatchService.leaveAllMatches();

      // Korisnik je možda već izabrao drugo takmičenje.
      if (requestId !== this.resultsRequestId) {
        return;
      }

      this.resultsService.getResults(competitionId).subscribe({
        next: response => {
          // Ignorišemo zastareli odgovor.
          if (requestId !== this.resultsRequestId) {
            return;
          }

          this.results = response;
          this.loadingResults = false;
          this.errorMessage = '';

          if (this.results.phases.length > 0) {
            this.selectedPhaseId = this.results.phases[0].id;

            this.selectLastRound(this.results.phases[0]);
          }

          void this.joinCompetitionMatches();
        },

        error: error => {
          if (requestId !== this.resultsRequestId) {
            return;
          }

          console.error(
            'Greška pri učitavanju rezultata:',
            error
          );

          this.loadingResults = false;
          this.errorMessage =
            error?.error?.message ??
            'Rezultate trenutno nije moguće učitati.';
        }
      });
    } catch (error) {
      if (requestId !== this.resultsRequestId) {
        return;
      }

      console.error(
        'Greška prilikom pripreme live rezultata:',
        error
      );

      this.loadingResults = false;
      this.errorMessage =
        'Rezultate trenutno nije moguće učitati.';
    }
  }


  // =========================================================
  // CHANGE PHASE
  // =========================================================

  onPhaseChange(): void {

    this.showOnlyLive = false;


    const phase =
      this.selectedPhase;


    if (!phase) {

      this.selectedRound = null;

      return;

    }


    this.selectLastRound(
      phase
    );

  }


  // =========================================================
  // LIVE FILTER
  // =========================================================

  toggleLiveFilter(): void {

    this.showOnlyLive =
      !this.showOnlyLive;

  }


  // =========================================================
  // SELECT LAST ROUND
  // =========================================================

  selectLastRound(
    phase: PublicResultsPhase
  ): void {

    if (
      this.phaseHasRounds(phase) &&
      phase.rounds.length > 0
    ) {

      this.selectedRound =
        Math.max(
          ...phase.rounds
        );

    } else {

      this.selectedRound =
        null;

    }

  }


  // =========================================================
  // SELECTED PHASE
  // =========================================================

  get selectedPhase():
    PublicResultsPhase | null {

    if (
      !this.results ||
      !this.selectedPhaseId
    ) {
      return null;
    }


    return (
      this.results.phases
        .find(
          phase =>
            phase.id ===
            this.selectedPhaseId
        ) ?? null
    );

  }


  // =========================================================
  // PHASE HAS ROUNDS
  // =========================================================

  phaseHasRounds(
    phase: PublicResultsPhase
  ): boolean {

    return (
      phase.type === 0 ||
      phase.type === 2
    ) &&
    phase.rounds.length > 0;

  }


  // =========================================================
  // VISIBLE GROUPS
  // =========================================================

  get visibleGroups():
    PublicResultsGroup[] {

    if (!this.selectedPhase) {
      return [];
    }


    return this.selectedPhase.groups

      .map(group => {

        let matches =
          group.matches;


        if (this.showOnlyLive) {

          matches =
            matches.filter(
              match =>
                this.isLiveMatch(match)
            );

        } else {

          matches =
            matches.filter(
              match =>
                match.status === 'Finished' ||
                match.status === 'Live'
            );


          if (
            this.phaseHasRounds(
              this.selectedPhase!
            ) &&
            this.selectedRound !== null
          ) {

            matches =
              matches.filter(
                match =>
                  match.round ===
                  this.selectedRound
              );

          }

        }


        return {
          ...group,
          matches
        };

      })

      .filter(
        group =>
          group.matches.length > 0
      );

  }


  // =========================================================
  // VISIBLE MATCH COUNT
  // =========================================================

  get visibleMatchCount(): number {

    return this.visibleGroups.reduce(
      (total, group) =>
        total +
        group.matches.length,
      0
    );

  }


  // =========================================================
  // PHASE TYPE
  // =========================================================

  getPhaseTypeLabel(
    phase: PublicResultsPhase
  ): string {

    switch (phase.type) {

      case 0:
        return 'Liga';

      case 1:
        return 'Grupe';

      case 2:
        return 'Playoff';

      case 3:
        return 'Knockout';

      default:
        return 'Takmičenje';

    }

  }


  // =========================================================
  // MATCH COUNT
  // =========================================================

  getPhaseMatchCount(
    phase: PublicResultsPhase
  ): number {

    return phase.groups.reduce(
      (total, group) =>
        total +
        group.matches.length,
      0
    );

  }


  // =========================================================
  // DATE
  // =========================================================

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


  // =========================================================
  // TIME
  // =========================================================

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


  // =========================================================
  // DAY
  // =========================================================

  formatDay(
    date: string
  ): string {

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        weekday: 'long'
      }
    ).format(
      new Date(date)
    );

  }


  // =========================================================
  // LOGO
  // =========================================================

  getTeamLogoUrl(
    logoUrl: string | null
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


    const apiBaseUrl =
      environment.apiUrl.replace(
        /\/api\/?$/,
        ''
      );


    return `${apiBaseUrl}${
      logoUrl.startsWith('/')
        ? ''
        : '/'
    }${logoUrl}`;

  }


  // =========================================================
  // TEAM INITIAL
  // =========================================================

  getTeamInitial(
    teamName: string
  ): string {

    if (!teamName) {
      return '?';
    }


    const words =
      teamName
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (words.length === 1) {

      return words[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();

  }


  // =========================================================
  // SCORE CLASS
  // =========================================================

  getHomeScoreClass(
    match: PublicResultMatch
  ): string {

    if (
      match.homeScore >
      match.awayScore
    ) {

      return 'winner-score';

    }


    if (
      match.homeScore <
      match.awayScore
    ) {

      return 'loser-score';

    }


    return 'draw-score';

  }


  getAwayScoreClass(
    match: PublicResultMatch
  ): string {

    if (
      match.awayScore >
      match.homeScore
    ) {

      return 'winner-score';

    }


    if (
      match.awayScore <
      match.homeScore
    ) {

      return 'loser-score';

    }


    return 'draw-score';

  }


  // =========================================================
  // TRACK BY
  // =========================================================

  trackByCompetition(
    index: number,
    item: PublicResultsCompetition
  ): number {

    return item.id;

  }


  trackByPhase(
    index: number,
    item: PublicResultsPhase
  ): number {

    return item.id;

  }


  trackByGroup(
    index: number,
    item: PublicResultsGroup
  ): number | string {

    return item.id ??
      `group-${index}`;

  }


  trackByMatch(
    index: number,
    item: PublicResultMatch
  ): number {

    return item.id;

  }


  // =========================================================
  // IS LIVE
  // =========================================================

  isLiveMatch(
    match: PublicResultMatch
  ): boolean {

    return (
      match.status
        ?.toLowerCase() ===
      'live'
    );

  }


  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.liveMatchSubscription?.unsubscribe();
    this.reconnectSubscription?.unsubscribe();
  }

}
