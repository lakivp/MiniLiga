import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormsModule
} from '@angular/forms';

import {
  Player,
  PlayerService
} from '../../services/player.service';

import {
  TeamService,
  Team
} from '../../services/team.service';

@Component({
  selector: 'app-admin-team-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl:
    './admin-team-players.component.html',
  styleUrl:
    './admin-team-players.component.css'
})
export class AdminTeamPlayersComponent
  implements OnInit {

  teamId = 0;


  team: Team | null = null;

  players: Player[] = [];

  loading = true;

  saving = false;

  error = '';

  success = '';

  searchTerm = '';

  selectedPosition = 'all';

  readonly pageSize = 9;

  currentPage = 1;

  showModal = false;
  // Modal za potvrdu brisanja igrača
  showDeleteModal = false;

  playerToDelete: Player | null = null;

  deletingPlayer = false;

  deleteError = '';

  editingPlayer: Player | null = null;

  photoFile: File | null = null;

  photoPreviewUrl: string | null = null;

  private savedPhotoUrl: string | null = null;

  removePhotoRequested = false;

  form = {
    firstName: '',
    lastName: '',
    displayName: '',
    jerseyNumber: null as number | null,
    position: '',
    photoUrl: '',
    isActive: true
  };

  positions = [
    'Golman',
    'Odbrana',
    'Vezni',
    'Napad'
  ];

  constructor(
    private route: ActivatedRoute,
    private playerService: PlayerService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {

    this.teamId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!this.teamId) {
      this.error =
        'Neispravan ID tima.';
      this.loading = false;
      return;
    }

    this.loadData();
  }

  loadData(): void {

    this.loading = true;

    this.error = '';

    this.teamService
      .getById(this.teamId)
      .subscribe({

        next: team => {
          this.team = team;

          this.loadPlayers();
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja tima.';

          this.loading = false;
        }
      });
  }

  loadPlayers(): void {

    this.playerService
      .getByTeam(this.teamId)
      .subscribe({

        next: players => {

          this.players = players;

          this.currentPage = Math.min(
            this.currentPage,
            Math.max(1, this.totalPages)
          );

          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja igrača.';

          this.loading = false;
        }
      });
  }

  get filteredPlayers(): Player[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.players.filter(player => {

      const fullName =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        (player.displayName ?? '')
          .toLowerCase()
          .includes(search) ||
        String(player.jerseyNumber ?? '')
          .includes(search);

      const matchesPosition =
        this.selectedPosition === 'all' ||
        player.position === this.selectedPosition;

      return matchesSearch &&
        matchesPosition;
    });
  }

  get totalPages(): number {

    return Math.ceil(
      this.filteredPlayers.length / this.pageSize
    );
  }

  get paginatedPlayers(): Player[] {

    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredPlayers.slice(
      start,
      start + this.pageSize
    );
  }

  get visiblePageNumbers(): number[] {

    const firstPage = Math.max(
      1,
      Math.min(this.currentPage - 2, this.totalPages - 4)
    );

    const lastPage = Math.min(
      this.totalPages,
      firstPage + 4
    );

    return Array.from(
      { length: Math.max(0, lastPage - firstPage + 1) },
      (_, index) => firstPage + index
    );
  }

  get firstVisiblePlayer(): number {

    return this.filteredPlayers.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastVisiblePlayer(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredPlayers.length
    );
  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  get activePlayersCount(): number {

    return this.players.filter(
      player => player.isActive
    ).length;
  }

  get goalkeepersCount(): number {

    return this.players.filter(
      player => player.position === 'Golman'
    ).length;
  }

  get fieldPlayersCount(): number {

    return this.players.filter(
      player => player.position !== 'Golman'
    ).length;
  }

  openCreateModal(): void {

    this.editingPlayer = null;

    this.form = {
      firstName: '',
      lastName: '',
      displayName: '',
      jerseyNumber: null,
      position: '',
      photoUrl: '',
      isActive: true
    };

    this.savedPhotoUrl = null;
    this.error = '';

    this.resetPhotoSelection();

    this.showModal = true;
  }

  openEditModal(player: Player): void {

    this.editingPlayer = player;

    this.form = {
      firstName: player.firstName,
      lastName: player.lastName,
      displayName: player.displayName ?? '',
      jerseyNumber: player.jerseyNumber,
      position: player.position ?? '',
      photoUrl: player.photoUrl ?? '',
      isActive: player.isActive
    };

    this.error = '';

    this.resetPhotoSelection();

    this.savedPhotoUrl = player.photoUrl;
    this.photoPreviewUrl = player.photoUrl;

    this.showModal = true;
  }

  onPhotoFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      this.error = 'Izaberite JPG, PNG, WEBP ili GIF sliku.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Slika ne može biti veća od 5 MB.';
      input.value = '';
      return;
    }

    this.clearPhotoPreviewUrl();
    this.photoFile = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
    this.removePhotoRequested = false;
    this.form.photoUrl = '';
    this.error = '';
  }

  removePhoto(): void {

    this.clearPhotoPreviewUrl();
    this.photoFile = null;
    this.removePhotoRequested = Boolean(this.savedPhotoUrl);
    this.photoPreviewUrl = null;
    this.form.photoUrl = '';
  }

  private resetPhotoSelection(): void {

    this.clearPhotoPreviewUrl();
    this.photoFile = null;
    this.photoPreviewUrl = null;
    this.removePhotoRequested = false;
  }

  private clearPhotoPreviewUrl(): void {

    if (this.photoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
  }

  closeModal(): void {

    if (this.saving) {
      return;
    }

    this.showModal = false;

    this.savedPhotoUrl = null;
    this.resetPhotoSelection();
  }

  savePlayer(): void {

    if (
      !this.form.firstName.trim() ||
      !this.form.lastName.trim()
    ) {

      this.error =
        'Ime i prezime igrača su obavezni.';

      return;
    }

    this.saving = true;

    this.error = '';

    const payload = {
      firstName:
        this.form.firstName.trim(),

      lastName:
        this.form.lastName.trim(),

      displayName:
        this.form.displayName.trim() || null,

      jerseyNumber:
        this.form.jerseyNumber,

      position:
        this.form.position || null,

      photoUrl:
        this.removePhotoRequested
          ? null
          : this.form.photoUrl.trim() || null,

      teamId:
        this.teamId,

      isActive:
        this.form.isActive
    };

    if (this.editingPlayer) {

      this.playerService
        .update(
          this.editingPlayer.id,
          payload
        )
        .subscribe({

          next: () => {
            this.persistPlayerPhoto(
              this.editingPlayer!.id,
              'Igrač je uspešno izmenjen.'
            );
          },

          error: error => {

            console.error(error);

            this.error =
              error?.error?.message ??
              'Greška prilikom izmene igrača.';

            this.saving = false;
          }
        });

      return;
    }

    this.playerService
      .create(payload)
      .subscribe({

        next: player => {

          this.persistPlayerPhoto(
            player.id,
            'Igrač je uspešno dodat.',
            player
          );
        },

        error: error => {

          console.error(error);

          this.error =
            error?.error?.message ??
            'Greška prilikom dodavanja igrača.';

          this.saving = false;
        }
      });
  }

    private persistPlayerPhoto(
      playerId: number,
      successMessage: string,
      newlyCreatedPlayer?: Player
    ): void {

      const finishSave = (): void => {
        this.success = successMessage;
        this.saving = false;
        this.showModal = false;
        this.savedPhotoUrl = null;
        this.resetPhotoSelection();
        this.loadPlayers();
      };

      const showUploadError = (error: unknown): void => {
        console.error('Greška pri čuvanju fotografije:', error);
        const response = error as { error?: { message?: string } };
        this.error = response.error?.message
          ?? 'Podaci su sačuvani, ali fotografiju nije moguće sačuvati.';

        if (newlyCreatedPlayer) {
          this.editingPlayer = newlyCreatedPlayer;
        }

        this.saving = false;
        this.loadPlayers();
      };

      if (this.photoFile) {
        this.playerService.uploadPhoto(playerId, this.photoFile).subscribe({
          next: result => {
            this.form.photoUrl = result.photoUrl;
            this.savedPhotoUrl = result.photoUrl;
            finishSave();
          },
          error: showUploadError
        });
        return;
      }

      if (this.removePhotoRequested && this.editingPlayer) {
        this.playerService.deletePhoto(playerId).subscribe({
          next: finishSave,
          error: showUploadError
        });
        return;
      }

      finishSave();
    }

// Otvaranje modalnog prozora za brisanje
deletePlayer(player: Player): void {
  this.clearMessages();

  this.deleteError = '';
  this.playerToDelete = player;
  this.showDeleteModal = true;
}

// Zatvaranje modalnog prozora
closeDeleteModal(): void {
  if (this.deletingPlayer) {
    return;
  }

  this.showDeleteModal = false;
  this.playerToDelete = null;
  this.deleteError = '';
}

// Zatvaranje pritiskom na Escape
@HostListener('document:keydown.escape')
onEscapeKey(): void {
  if (this.showDeleteModal) {
    this.closeDeleteModal();
  }
}

// Potvrda i izvršavanje brisanja
confirmDeletePlayer(): void {
  if (!this.playerToDelete || this.deletingPlayer) {
    return;
  }

  const playerId = this.playerToDelete.id;

  this.deletingPlayer = true;
  this.deleteError = '';

  this.playerService.delete(playerId).subscribe({

    next: () => {
      this.success = 'Igrač je uspešno obrisan.';

      this.showDeleteModal = false;
      this.playerToDelete = null;
      this.deletingPlayer = false;
      this.deleteError = '';

      this.loadPlayers();
    },

    error: error => {
      console.error(error);

      this.deleteError =
        error?.error?.message
        ?? 'Igrača nije moguće obrisati.';

      this.deletingPlayer = false;
    }

  });
}

  clearMessages(): void {

    this.error = '';

    this.success = '';
  }

  getPlayerName(player: Player): string {

    return player.displayName?.trim()
      || `${player.firstName} ${player.lastName}`;
  }

  getInitials(player: Player): string {

    const first =
      player.firstName?.charAt(0)
        .toUpperCase() ?? '';

    const last =
      player.lastName?.charAt(0)
        .toUpperCase() ?? '';

    return `${first}${last}`;
  }

  getPositionClass(
    position: string | null
  ): string {

    switch (position) {

      case 'Golman':
        return 'goalkeeper';

      case 'Odbrana':
        return 'defender';

      case 'Vezni':
        return 'midfielder';

      case 'Napad':
        return 'forward';

      default:
        return 'unknown';
    }
  }
}

