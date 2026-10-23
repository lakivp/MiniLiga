import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Subject, takeUntil } from 'rxjs';

import {
  MatchService
} from '../../services/match.service';

import {
  MatchLineupService,
  MatchLineup,
  CreateMatchLineup,
  UpdateMatchLineup
} from '../../services/match-lineup.service';

import {
  PlayerService,
  Player
} from '../../services/player.service';

import {
  AlertDialogService
} from '../../services/alert-dialog.service';

@Component({
  selector: 'app-admin-match-lineup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl:
    './admin-match-lineup.component.html',
  styleUrl:
    './admin-match-lineup.component.css'
})
export class AdminMatchLineupComponent
  implements OnInit, OnDestroy {

  match: any = null;

  homePlayers: Player[] = [];
  awayPlayers: Player[] = [];

  homeLineup: MatchLineup[] = [];
  awayLineup: MatchLineup[] = [];

  selectedTeamId: number | null = null;

  selectedPlayerId: number | null = null;

  selectedPlayer: Player | null = null;

  isStarter = true;

  position = '';

  order = 1;

  notes = '';

  editingLineupId: number | null = null;

  loading = true;

  loadingPlayers = false;

  saving = false;

  deletingPlayer = false;

  playerToRemove: MatchLineup | null = null;

  error = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private lineupService: MatchLineupService,
    private playerService: PlayerService,
    private alertDialog: AlertDialogService
  ) {}

  ngOnInit(): void {

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
  }

  loadMatch(matchId: number): void {

    this.loading = true;

    this.matchService
      .getMatchDetails(matchId)
      .subscribe({

        next: match => {

          this.match = match;

          this.selectedTeamId =
            match.homeTeam?.id ?? null;

          this.loadLineup(matchId);
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja utakmice.';

          this.loading = false;
        }
      });
  }

  loadPlayers(): void {

    if (!this.match) {
      return;
    }

    const homeTeamId =
      this.match.homeTeam?.id;

    const awayTeamId =
      this.match.awayTeam?.id;

    if (!homeTeamId || !awayTeamId) {
      return;
    }

    this.loadingPlayers = true;

    this.playerService
      .getByTeam(homeTeamId)
      .subscribe({

        next: players => {

          this.homePlayers =
            players.filter(
              player => player.isActive
            );

          this.checkPlayersLoaded();
        },

        error: error => {

          console.error(error);

          this.loadingPlayers = false;
        }
      });

    this.playerService
      .getByTeam(awayTeamId)
      .subscribe({

        next: players => {

          this.awayPlayers =
            players.filter(
              player => player.isActive
            );

          this.checkPlayersLoaded();
        },

        error: error => {

          console.error(error);

          this.loadingPlayers = false;
        }
      });
  }

  private playersLoaded = 0;

  private checkPlayersLoaded(): void {

    this.playersLoaded++;

    if (this.playersLoaded >= 2) {

      this.loadingPlayers = false;
    }
  }

  loadLineup(matchId: number): void {

    this.lineupService
      .populateCurrentRoster(matchId)
      .subscribe({

        next: lineup => {

          const homeTeamId =
            this.match.homeTeam?.id;

          const awayTeamId =
            this.match.awayTeam?.id;

          this.homeLineup =
            lineup.filter(
              player =>
                player.teamId === homeTeamId
            );

          this.awayLineup =
            lineup.filter(
              player =>
                player.teamId === awayTeamId
            );

          this.sortLineups();
          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja sastava.';

          this.loading = false;
        }
      });
  }

  sortLineups(): void {

    const sortFunction =
      (a: MatchLineup, b: MatchLineup) => {

        if (
          a.isStarter !== b.isStarter
        ) {

          return a.isStarter ? -1 : 1;
        }

        return a.order - b.order;
      };

    this.homeLineup =
      [...this.homeLineup]
        .sort(sortFunction);

    this.awayLineup =
      [...this.awayLineup]
        .sort(sortFunction);
  }

  getSelectedTeamPlayers(): Player[] {

    if (
      !this.selectedTeamId
    ) {
      return [];
    }

    if (
      this.selectedTeamId ===
      this.match?.homeTeam?.id
    ) {

      return this.homePlayers;
    }

    return this.awayPlayers;
  }

  getSelectedTeamLineup(): MatchLineup[] {

    if (
      !this.selectedTeamId
    ) {
      return [];
    }

    if (
      this.selectedTeamId ===
      this.match?.homeTeam?.id
    ) {

      return this.homeLineup;
    }

    return this.awayLineup;
  }

  getAvailablePlayers(): Player[] {

    const lineup =
      this.getSelectedTeamLineup();

    const lineupPlayerIds =
      new Set(
        lineup.map(
          player => player.playerId
        )
      );

    return this.getSelectedTeamPlayers()
      .filter(
        player =>
          !lineupPlayerIds.has(player.id)
      );
  }

  onTeamChange(): void {

    this.selectedPlayerId = null;

    this.selectedPlayer = null;

    this.editingLineupId = null;

    this.position = '';

    this.notes = '';

    this.isStarter = true;

    const lineup =
      this.getSelectedTeamLineup();

    this.order =
      lineup.length + 1;
  }

  onPlayerChange(): void {

    if (!this.selectedPlayerId) {

      this.selectedPlayer = null;

      return;
    }

    this.selectedPlayer =
      this.getSelectedTeamPlayers()
        .find(
          player =>
            player.id ===
            this.selectedPlayerId
        ) ?? null;

    if (this.selectedPlayer) {

      this.position =
        this.selectedPlayer.position ?? '';

      this.order =
        this.getNextOrder();
    }
  }

  getNextOrder(): number {

    const lineup =
      this.getSelectedTeamLineup();

    if (!lineup.length) {
      return 1;
    }

    return Math.max(
      ...lineup.map(
        player => player.order
      )
    ) + 1;
  }

  addPlayer(): void {

    const matchId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );

    if (
      !matchId ||
      !this.selectedTeamId ||
      !this.selectedPlayerId
    ) {

      this.alertDialog.show(
        'Izaberi tim i igrača.'
      );

      return;
    }

    const data: CreateMatchLineup = {

      playerId:
        this.selectedPlayerId,

      teamId:
        this.selectedTeamId,

      isStarter:
        this.isStarter,

      isSubstitute:
        !this.isStarter,

      position:
        this.position || null,

      order:
        this.order,

      enteredMinute:
        null,

      leftMinute:
        null,

      notes:
        this.notes || null
    };

    this.saving = true;

    this.lineupService
      .addPlayer(
        matchId,
        data
      )
      .subscribe({

        next: () => {

          this.saving = false;

          this.resetForm();

          this.loadLineup(matchId);
        },

        error: error => {

          console.error(error);

          this.saving = false;

          this.alertDialog.show(
            error?.error?.message ??
            'Greška prilikom dodavanja igrača.'
          );
        }
      });
  }

  editPlayer(
    player: MatchLineup
  ): void {

    this.editingLineupId =
      player.id;

    this.selectedTeamId =
      player.teamId;

    this.selectedPlayerId =
      player.playerId;

    this.selectedPlayer =
      this.getSelectedTeamPlayers()
        .find(
          x => x.id === player.playerId
        ) ?? null;

    this.isStarter =
      player.isStarter;

    this.position =
      player.position ?? '';

    this.order =
      player.order;

    this.notes =
      player.notes ?? '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  updatePlayer(): void {

    if (
      !this.editingLineupId
    ) {
      return;
    }

    const data: UpdateMatchLineup = {

      isStarter:
        this.isStarter,

      isSubstitute:
        !this.isStarter,

      position:
        this.position || null,

      order:
        this.order,

      enteredMinute:
        null,

      leftMinute:
        null,

      notes:
        this.notes || null
    };

    this.saving = true;

    this.lineupService
      .updatePlayer(
        this.editingLineupId,
        data
      )
      .subscribe({

        next: () => {

          const matchId =
            Number(
              this.route.snapshot
                .paramMap
                .get('id')
            );

          this.saving = false;

          this.resetForm();

          this.loadLineup(matchId);
        },

        error: error => {

          console.error(error);

          this.saving = false;

          this.alertDialog.show(
            error?.error?.message ??
            'Greška prilikom izmene igrača.'
          );
        }
      });
  }

  save(): void {

    if (
      this.editingLineupId
    ) {

      this.updatePlayer();

    } else {

      this.addPlayer();
    }
  }

  removePlayer(
    player: MatchLineup
  ): void {

    this.playerToRemove = player;
  }

  cancelRemovePlayer(): void {

    if (this.deletingPlayer) {
      return;
    }

    this.playerToRemove = null;
  }

  confirmRemovePlayer(): void {

    if (!this.playerToRemove || this.deletingPlayer) {
      return;
    }

    const player = this.playerToRemove;

    this.deletingPlayer = true;

    this.lineupService
      .removePlayer(player.id)
      .subscribe({

        next: () => {

          this.deletingPlayer = false;

          this.playerToRemove = null;

          const matchId =
            Number(
              this.route.snapshot
                .paramMap
                .get('id')
            );

          this.loadLineup(matchId);
        },

        error: error => {

          console.error(error);

          this.deletingPlayer = false;

          this.playerToRemove = null;

          this.alertDialog.show(
            error?.error?.message ??
            'Greška prilikom uklanjanja igrača.'
          );
        }
      });
  }

  resetForm(): void {

    this.editingLineupId = null;

    this.selectedPlayerId = null;

    this.selectedPlayer = null;

    this.isStarter = true;

    this.position = '';

    this.notes = '';

    this.order =
      this.getNextOrder();
  }

  getPlayerName(
    player: Player
  ): string {

    return player.displayName
      ?? `${player.firstName} ${player.lastName}`;
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }
}

