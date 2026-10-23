import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  Subject,
  takeUntil
} from 'rxjs';

import { MatchService } from '../../services/match.service';
import { LiveMatchService } from '../../services/live-match.service';
import {
  Player,
  PlayerService
} from '../../services/player.service';
import { AlertDialogService } from '../../services/alert-dialog.service';


@Component({
  selector: 'app-admin-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-match.component.html',
  styleUrl: './admin-match.component.css'
})
export class AdminMatchComponent
  implements OnInit, OnDestroy {


  // =========================================================
  // UTAKMICA
  // =========================================================

  match: any = null;

  loading = true;

  error = '';

  saving = false;

  finishing = false;

  starting = false;

  matchActionConfirmation: 'start' | 'finish' | null = null;
  deleteEventConfirmation: number | null = null;

  // =========================================================
  // EVENT FORM
  // =========================================================

  selectedEventType = 0;

  selectedPlayerId: number | null = null;

  selectedRelatedPlayerId: number | null = null;

  minute = 1;

  description = '';


  // =========================================================
  // IGRAČI
  // =========================================================

  private playersById =
    new Map<number, Player>();

  private playerNamesLoaded = false;


  // =========================================================
  // DESTROY
  // =========================================================

  private destroy$ =
    new Subject<void>();


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private liveMatchService: LiveMatchService,
    private playerService: PlayerService,
    private alertDialog: AlertDialogService
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (!matchId) {

      this.error =
        'Neispravan ID utakmice.';

      this.loading = false;

      return;

    }


    this.loadMatch(matchId);

    this.subscribeToUpdates(matchId);


    try {

      await this.liveMatchService
        .joinMatch(matchId);

    } catch (error) {

      console.error(
        'SignalR greška:',
        error
      );

    }

  }


  // =========================================================
  // UČITAVANJE UTAKMICE
  // =========================================================

  loadMatch(matchId: number): void {

    this.loading = true;

    this.error = '';


    this.matchService
      .getMatchDetails(matchId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: data => {

          this.match = data;


          if (!this.playerNamesLoaded) {

            this.loadPlayerNames();

          }


          this.loading = false;

        },

        error: error => {

          console.error(
            'Greška prilikom učitavanja utakmice:',
            error
          );


          this.error =
            error?.error?.message
            ??
            'Greška prilikom učitavanja utakmice.';


          this.loading = false;

        }

      });

  }


  // =========================================================
  // IGRAČI
  // =========================================================

  private loadPlayerNames(): void {

    this.playerService
      .getAll()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: players => {

          this.playersById =
            new Map(
              players.map(
                player => [
                  player.id,
                  player
                ]
              )
            );


          this.playerNamesLoaded = true;

        },

        error: error => {

          console.error(
            'Greška prilikom učitavanja igrača:',
            error
          );

        }

      });

  }


  // =========================================================
  // IME IGRAČA
  // =========================================================

  getFullPlayerName(
    playerId: number | null | undefined,
    fallbackName: string | null | undefined
  ): string {

    if (
      playerId !== null &&
      playerId !== undefined
    ) {

      const player =
        this.playersById.get(playerId);


      if (player) {

        return (
          `${player.firstName} ${player.lastName}`
        ).trim();

      }

    }


    return fallbackName ?? '';

  }


  // =========================================================
  // SIGNALR
  // =========================================================

  private subscribeToUpdates(
    matchId: number
  ): void {


    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    this.liveMatchService
      .matchUpdated$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(event => {

        if (
          event.matchId !== matchId
        ) {

          return;

        }


        this.loadMatch(matchId);

      });


    // -------------------------------------------------------
    // START
    // -------------------------------------------------------

    this.liveMatchService
      .matchStarted$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(event => {

        if (
          event.matchId !== matchId
        ) {

          return;

        }


        this.loadMatch(matchId);

      });


    // -------------------------------------------------------
    // FINISH
    // -------------------------------------------------------

    this.liveMatchService
      .matchFinished$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(event => {

        if (
          event.matchId !== matchId
        ) {

          return;

        }


        this.loadMatch(matchId);

      });

  }


  // =========================================================
  // STATUS
  // =========================================================

  getStatusText(
    status: number
  ): string {

    switch (status) {

      case 0:
        return 'Zakazano';

      case 1:
        return 'Uživo';

      case 2:
        return 'Završeno';

      case 3:
        return 'Odloženo';

      case 4:
        return 'Otkazano';

      default:
        return 'Nepoznat status';

    }

  }


  isScheduled(): boolean {

    return this.match?.status === 0;

  }


  isLive(): boolean {

    return this.match?.status === 1;

  }


  isFinished(): boolean {

    return this.match?.status === 2;

  }


  // =========================================================
  // SVI IGRAČI
  // =========================================================

  getAllPlayers(): any[] {

    if (!this.match) {

      return [];

    }


    return [
      ...(this.match.homeLineup ?? []),
      ...(this.match.awayLineup ?? [])
    ];

  }

  getEventsForTeam(teamId: number | null): any[] {

    if (teamId === null) {
      return [];
    }

    return (this.match?.events ?? [])
      .filter(
        (matchEvent: any) =>
          (matchEvent.teamId ?? matchEvent.relatedPlayerTeamId) === teamId
      );
  }

  getEventGroups(): Array<{
    teamId: number | null;
    sideLabel: string;
    teamName: string;
    logoUrl: string | null;
    events: any[];
  }> {

    const homeTeam = this.match?.homeTeam;
    const awayTeam = this.match?.awayTeam;

    return [
      {
        teamId: homeTeam?.id ?? null,
        sideLabel: 'DOMAĆIN',
        teamName: homeTeam?.name ?? 'Domaćin',
        logoUrl: homeTeam?.logoUrl ?? null,
        events: this.getEventsForTeam(homeTeam?.id ?? null)
      },
      {
        teamId: awayTeam?.id ?? null,
        sideLabel: 'GOST',
        teamName: awayTeam?.name ?? 'Gost',
        logoUrl: awayTeam?.logoUrl ?? null,
        events: this.getEventsForTeam(awayTeam?.id ?? null)
      }
    ];
  }

  openMatchActionConfirmation(
    action: 'start' | 'finish'
  ): void {

    if (
      (action === 'start' && (!this.isScheduled() || this.starting)) ||
      (action === 'finish' && (!this.isLive() || this.finishing))
    ) {
      return;
    }

    this.matchActionConfirmation = action;
  }

  closeMatchActionConfirmation(): void {

    if (this.starting || this.finishing) {
      return;
    }

    this.matchActionConfirmation = null;
  }

  confirmMatchAction(): void {

    const action = this.matchActionConfirmation;

    if (!action || this.starting || this.finishing) {
      return;
    }

    this.matchActionConfirmation = null;

    if (action === 'start') {
      this.startMatch();
      return;
    }

    this.finishMatch();
  }

  openDeleteEventConfirmation(eventId: number): void {
    if (!this.isLive()) {
      return;
    }

    this.deleteEventConfirmation = eventId;
  }

  closeDeleteEventConfirmation(): void {
    this.deleteEventConfirmation = null;
  }


  // =========================================================
  // PROVERA DA LI JE IGRAČ TRENUTNO AKTIVAN
  // =========================================================

  isPlayerCurrentlyOnPitch(
    player: any
  ): boolean {

    if (!player) {

      return false;

    }


    /*
     * STARTER:
     *
     * starter = true
     * leftMinute = null
     *
     * znači da je trenutno na terenu.
     */

    if (
      player.isStarter &&
      player.leftMinute == null
    ) {

      return true;

    }


    /*
     * REZERVA KOJA JE UŠLA:
     *
     * substitute = true
     * enteredMinute != null
     * leftMinute = null
     */

    if (
      player.isSubstitute &&
      player.enteredMinute != null &&
      player.leftMinute == null
    ) {

      return true;

    }


    return false;

  }


  // =========================================================
  // IGRAČI TRENUTNO NA TERENU
  // =========================================================

  getPlayersCurrentlyOnPitch(): any[] {

    return this.getAllPlayers()
      .filter(
        player =>
          this.isPlayerCurrentlyOnPitch(player)
      );

  }


  // =========================================================
  // IGRAČI KOJI MOGU DA UĐU
  // =========================================================

  getAvailableSubstitutes(): any[] {

    return this.getAllPlayers()
      .filter(player => {

        return (
          player.isSubstitute &&
          player.enteredMinute == null
        );

      });

  }

  hasPlayersWhoEntered(
    lineup: Array<{
      isSubstitute: boolean;
      enteredMinute: number | null;
    }> | null | undefined
  ): boolean {

    return lineup?.some(
      lineupPlayer =>
        lineupPlayer.isSubstitute &&
        lineupPlayer.enteredMinute != null
    ) ?? false;
  }


  // =========================================================
  // IGRAČI ZA DOGAĐAJ
  // =========================================================

  getPlayersForSelectedEvent(): any[] {

    /*
     * Kod svih standardnih događaja:
     *
     * Gol
     * Žuti
     * Crveni
     * Asistencija
     *
     * možemo izabrati samo igrača koji je
     * trenutno na terenu.
     */

    if (
      this.selectedEventType === 0 ||
      this.selectedEventType === 1 ||
      this.selectedEventType === 2 ||
      this.selectedEventType === 3
    ) {

      return this.getPlayersCurrentlyOnPitch();

    }


    /*
     * Kod izmene biramo igrača koji IZLAZI.
     */

    if (
      this.selectedEventType === 4
    ) {

      return this.getPlayersCurrentlyOnPitch();

    }


    return [];

  }


  // =========================================================
  // IGRAČI KOJI MOGU DA UĐU
  // =========================================================

  getHomePlayersForSelectedEvent(): any[] {
    return this.getPlayersFromLineup(
      this.match?.homeLineup,
      this.getPlayersForSelectedEvent()
    );
  }

  getAwayPlayersForSelectedEvent(): any[] {
    return this.getPlayersFromLineup(
      this.match?.awayLineup,
      this.getPlayersForSelectedEvent()
    );
  }

  getPlayersForSubstitution(): any[] {

    return this.getAvailableSubstitutes();

  }

  getHomePlayersForSubstitution(): any[] {
    return this.getPlayersFromLineup(
      this.match?.homeLineup,
      this.getPlayersForSubstitution()
    );
  }

  getAwayPlayersForSubstitution(): any[] {
    return this.getPlayersFromLineup(
      this.match?.awayLineup,
      this.getPlayersForSubstitution()
    );
  }

  private getPlayersFromLineup(
    lineup: any[] | null | undefined,
    availablePlayers: any[]
  ): any[] {

    const playerIds = new Set(
      (lineup ?? []).map(player => player.playerId)
    );

    return availablePlayers.filter(player =>
      playerIds.has(player.playerId)
    );
  }


  // =========================================================
  // DA LI JE IZABRANI IGRAČ JOŠ UVEK AKTIVAN
  // =========================================================

  isSelectedPlayerValid(): boolean {

    if (!this.selectedPlayerId) {

      return false;

    }


    const player =
      this.getAllPlayers()
        .find(
          item =>
            item.playerId ===
            this.selectedPlayerId
        );


    return (
      player != null &&
      this.isPlayerCurrentlyOnPitch(player)
    );

  }


  // =========================================================
  // DA LI JE IGRAČ KOJI ULAZI VALIDAN
  // =========================================================

  isSelectedRelatedPlayerValid(): boolean {

    if (
      !this.selectedRelatedPlayerId
    ) {

      return false;

    }


    const player =
      this.getAllPlayers()
        .find(
          item =>
            item.playerId ===
            this.selectedRelatedPlayerId
        );


    if (!player) {

      return false;

    }


    return (
      player.isSubstitute &&
      player.enteredMinute == null
    );

  }


  // =========================================================
  // PROMENA TIPA DOGAĐAJA
  // =========================================================

  onEventTypeChange(): void {

    this.selectedPlayerId = null;

    this.selectedRelatedPlayerId = null;

    this.description = '';

  }


  // =========================================================
  // DODAVANJE DOGAĐAJA
  // =========================================================

  addEvent(): void {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (!matchId) {

      return;

    }


    if (!this.isLive()) {

      this.alertDialog.show(
        'Događaj se može dodati samo dok je utakmica uživo.'
      );

      return;

    }


    if (this.saving) {

      return;

    }


    // -------------------------------------------------------
    // IGRAČ
    // -------------------------------------------------------

    if (!this.selectedPlayerId) {

      this.alertDialog.show(
        'Izaberi igrača.'
      );

      return;

    }


    // -------------------------------------------------------
    // VALIDACIJA IGRAČA
    // -------------------------------------------------------

    if (
      !this.isSelectedPlayerValid()
    ) {

      this.alertDialog.show(
        'Izabrani igrač trenutno nije na terenu.'
      );

      return;

    }


    // -------------------------------------------------------
    // MINUT
    // -------------------------------------------------------

    if (
      this.minute === null ||
      this.minute === undefined ||
      this.minute < 0
    ) {

      this.alertDialog.show(
        'Unesi ispravan minut.'
      );

      return;

    }


    // -------------------------------------------------------
    // IZMENA
    // -------------------------------------------------------

    if (
      this.selectedEventType === 4
    ) {

      if (
        !this.selectedRelatedPlayerId
      ) {

        this.alertDialog.show(
          'Izaberi igrača koji ulazi.'
        );

        return;

      }


      if (
        !this.isSelectedRelatedPlayerValid()
      ) {

        this.alertDialog.show(
          'Izabrani igrač koji ulazi nije validna rezerva.'
        );

        return;

      }


      if (
        this.selectedPlayerId ===
        this.selectedRelatedPlayerId
      ) {

        this.alertDialog.show(
          'Igrač koji izlazi i igrač koji ulazi ne mogu biti isti.'
        );

        return;

      }

    }


    // -------------------------------------------------------
    // SLANJE
    // -------------------------------------------------------

    this.saving = true;


    this.matchService
      .addEvent(
        matchId,
        {
          playerId:
            this.selectedPlayerId,

          relatedPlayerId:
            this.selectedEventType === 4
              ? this.selectedRelatedPlayerId
              : null,

          type:
            this.selectedEventType,

          minute:
            this.minute,

          description:
            this.description.trim() || null

        }
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: () => {

          this.saving = false;

          this.resetEventForm();

          /*
           * Backend/SignalR će poslati update,
           * ali odmah učitavamo podatke i lokalno.
           */

          this.loadMatch(matchId);

        },

        error: error => {

          console.error(
            'Greška prilikom dodavanja događaja:',
            error
          );


          this.saving = false;


          this.alertDialog.show(
            error?.error?.message
            ??
            'Greška prilikom dodavanja događaja.'
          );

        }

      });

  }


  // =========================================================
  // BRISANJE DOGAĐAJA
  // =========================================================

  deleteEvent(
    eventId: number
  ): void {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (!matchId) {

      return;

    }


    if (!this.isLive()) {

      this.alertDialog.show(
        'Događaj možeš obrisati samo dok je utakmica uživo.'
      );

      return;

    }


    this.openDeleteEventConfirmation(eventId);
    return;


    this.matchService
      .deleteEvent(
        matchId,
        eventId
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: () => {

          this.loadMatch(matchId);

        },

        error: error => {

          console.error(
            'Greška prilikom brisanja događaja:',
            error
          );


          this.alertDialog.show(
            error?.error?.message
            ??
            'Greška prilikom brisanja događaja.'
          );

        }

      });

  }

  confirmDeleteEvent(): void {
    const eventId = this.deleteEventConfirmation;

    if (!eventId || !this.isLive()) {
      return;
    }

    const matchId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!matchId) {
      return;
    }

    this.deleteEventConfirmation = null;

    this.matchService
      .deleteEvent(
        matchId,
        eventId
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.loadMatch(matchId);
        },

        error: error => {
          console.error(
            'Greška prilikom brisanja događaja:',
            error
          );

          this.alertDialog.show(
            error?.error?.message
            ??
            'Greška prilikom brisanja događaja.'
          );
        }
      });
  }


  // =========================================================
  // START UTAKMICE
  // =========================================================

  startMatch(): void {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (!matchId) {

      return;

    }


    if (!this.isScheduled()) {

      return;

    }


    if (this.starting) {

      return;

    }


    this.starting = true;


    this.matchService
      .startMatch(matchId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: () => {

          this.starting = false;

          this.loadMatch(matchId);

        },

        error: error => {

          console.error(
            'Greška prilikom pokretanja utakmice:',
            error
          );


          this.starting = false;


          this.alertDialog.show(
            error?.error?.message
            ??
            'Greška prilikom pokretanja utakmice.'
          );

        }

      });

  }


  // =========================================================
  // FINISH UTAKMICE
  // =========================================================

  finishMatch(): void {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (!matchId) {

      return;

    }


    if (!this.isLive()) {

      return;

    }


    if (this.finishing) {

      return;

    }


    this.finishing = true;


    this.matchService
      .finishMatch(matchId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: () => {

          this.finishing = false;

          this.loadMatch(matchId);

        },

        error: error => {

          console.error(
            'Greška prilikom završavanja utakmice:',
            error
          );


          this.finishing = false;


          this.alertDialog.show(
            error?.error?.message
            ??
            'Greška prilikom završavanja utakmice.'
          );

        }

      });

  }


  // =========================================================
  // RESET FORME
  // =========================================================

  resetEventForm(): void {

    this.selectedPlayerId = null;

    this.selectedRelatedPlayerId = null;

    this.minute = 1;

    this.description = '';

  }


  // =========================================================
  // TEKST DOGAĐAJA
  // =========================================================

  getEventText(
    type: number
  ): string {

    switch (type) {

      case 0:
        return 'Gol';

      case 1:
        return 'Žuti karton';

      case 2:
        return 'Crveni karton';

      case 3:
        return 'Asistencija';

      case 4:
        return 'Izmena';

      default:
        return 'Događaj';

    }

  }


  // =========================================================
  // IKONA DOGAĐAJA
  // =========================================================

  getEventIcon(
    type: number
  ): string {

    switch (type) {

      case 0:
        return '⚽';

      case 1:
        return '🟨';

      case 2:
        return '🟥';

      case 3:
        return '🎯';

      case 4:
        return '🔄';

      default:
        return '•';

    }

  }


  // =========================================================
  // DESTROY
  // =========================================================

  async ngOnDestroy(): Promise<void> {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (matchId) {

      try {

        await this.liveMatchService
          .leaveMatch(matchId);

      } catch (error) {

        console.error(
          'SignalR leaveMatch greška:',
          error
        );

      }

    }


    this.destroy$.next();

    this.destroy$.complete();


    try {

      await this.liveMatchService
        .disconnect();

    } catch (error) {

      console.error(
        'SignalR disconnect greška:',
        error
      );

    }

  }

}
