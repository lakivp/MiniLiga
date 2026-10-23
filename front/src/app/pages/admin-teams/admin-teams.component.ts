import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  TeamService,
  Team,
  CreateTeam
} from '../../services/team.service';

@Component({
  selector: 'app-admin-teams',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './admin-teams.component.html',

  styleUrl:
    './admin-teams.component.css'
})
export class AdminTeamsComponent
  implements OnInit {

  showDeleteModal = false;

  teamToDelete: Team | null = null;

  deleting = false; 

  teams: Team[] = [];

  readonly pageSize = 9;
  
  searchTerm = '';
  
  currentPage = 1;

  loading = true;

  error = '';

  success = '';

  saving = false;

  showForm = false;

  editingId: number | null = null;

  logoFile: File | null = null;

  logoPreviewUrl: string | null = null;

  private savedLogoUrl: string | null = null;

  removeLogoRequested = false;

  form: CreateTeam = this.createEmptyForm();

  

  constructor(
    private teamService: TeamService
  ) {}

  ngOnInit(): void {

    this.loadTeams();
  }
  
  createEmptyForm(): CreateTeam {

    return {
      name: '',
      shortName: '',
      logoUrl: '',
      primaryColor: '',
      secondaryColor: '',
      description: '',
      isActive: true
    };
  }

  loadTeams(): void {

    this.loading = true;

    this.teamService
      .getAll()
      .subscribe({

        next: teams => {

          this.teams = teams;

          this.currentPage = Math.min(
            this.currentPage,
            Math.max(1, this.totalPages)
          );

          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.error =
            error?.error?.message
            ?? 'Greška prilikom učitavanja timova.';

          this.loading = false;
        }

      });
  }

  // Timovi koji odgovaraju unetom nazivu
  get filteredTeams(): Team[] {
    const search = this.searchTerm
      .trim()
      .toLocaleLowerCase('sr');

    if (!search) {
      return this.teams;
    }

    return this.teams.filter(team =>
      (team.name ?? '')
        .toLocaleLowerCase('sr')
        .includes(search)
    );
  }

  // Broj stranica računa se na osnovu filtriranih timova
  get totalPages(): number {
    return Math.ceil(
      this.filteredTeams.length / this.pageSize
    );
  }

  get paginatedTeams(): Team[] {
    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredTeams.slice(
      start,
      start + this.pageSize
    );
  }

  onSearchChange(): void {
    // Svaka nova pretraga počinje od prve stranice
    this.currentPage = 1;
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


  get firstVisibleTeam(): number {
    return this.filteredTeams.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastVisibleTeam(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredTeams.length
    );
  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  openCreate(): void {

    this.clearMessages();

    this.editingId = null;

    this.form =
      this.createEmptyForm();

    this.savedLogoUrl = null;
    this.resetLogoSelection();

    this.showForm = true;
  }

  openEdit(team: Team): void {

    this.clearMessages();

    this.editingId = team.id;

    this.form = {
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      description: team.description,
      isActive: team.isActive
    };

    this.resetLogoSelection();

    this.savedLogoUrl = team.logoUrl;
    this.logoPreviewUrl = team.logoUrl;

    this.showForm = true;
    this.scrollToTeamForm();
  }

  onLogoFileSelected(event: Event): void {

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

    this.clearLogoPreviewUrl();
    this.logoFile = file;
    this.logoPreviewUrl = URL.createObjectURL(file);
    this.removeLogoRequested = false;
    this.form.logoUrl = null;
    this.error = '';
  }

  removeLogo(): void {

    this.clearLogoPreviewUrl();
    this.logoFile = null;
    this.removeLogoRequested = Boolean(this.savedLogoUrl);
    this.logoPreviewUrl = null;
    this.form.logoUrl = null;
  }

  private resetLogoSelection(): void {

    this.clearLogoPreviewUrl();
    this.logoFile = null;
    this.logoPreviewUrl = null;
    this.removeLogoRequested = false;
  }

  private clearLogoPreviewUrl(): void {

    if (this.logoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
  }

  cancelForm(): void {

    if (this.saving) {
      return;
    }

    this.showForm = false;

    this.editingId = null;

    this.form =
      this.createEmptyForm();

    this.savedLogoUrl = null;
    this.resetLogoSelection();
  }

  save(): void {

    this.clearMessages();

    if (
      !this.form.name.trim()
    ) {

      this.error =
        'Naziv tima je obavezan.';

      return;
    }

    this.saving = true;

    if (
      this.editingId === null
    ) {

      this.teamService
        .create(this.form)
        .subscribe({

          next: team => {

            this.persistLogo(team.id, 'Tim je uspešno dodat.');
          },

          error: error => {

            console.error(error);

            this.error =
              error?.error?.message
              ?? 'Greška prilikom dodavanja tima.';

            this.saving = false;
          }

        });

      return;
    }

    this.teamService
      .update(
        this.editingId,
        this.form
      )
      .subscribe({

        next: () => {

            this.persistLogo(this.editingId!, 'Tim je uspešno izmenjen.');
        },

        error: error => {

          console.error(error);

          this.error =
            error?.error?.message
            ?? 'Greška prilikom izmene tima.';

            this.saving = false;
        }

      });
  }

  private persistLogo(
    teamId: number,
    successMessage: string
  ): void {

    const finishSave = (): void => {
      this.saving = false;
      this.success = successMessage;
      this.cancelForm();
      this.loadTeams();
    };

    const showUploadError = (error: unknown): void => {
      console.error('Greška pri čuvanju grba:', error);
      const response = error as { error?: { message?: string } };
      this.error = response.error?.message
        ?? 'Tim je sačuvan, ali sliku nije moguće sačuvati.';
      this.editingId = teamId;
      this.saving = false;
      this.loadTeams();
    };

    if (this.logoFile) {
      this.teamService.uploadLogo(teamId, this.logoFile).subscribe({
        next: result => {
          this.form.logoUrl = result.logoUrl;
          finishSave();
        },
        error: showUploadError
      });
      return;
    }

    if (this.removeLogoRequested && this.editingId !== null) {
      this.teamService.deleteLogo(teamId).subscribe({
        next: finishSave,
        error: showUploadError
      });
      return;
    }

    finishSave();
  }

 // Otvaranje prozora za potvrdu brisanja
deleteTeam(team: Team): void {
  this.clearMessages();

  this.teamToDelete = team;
  this.showDeleteModal = true;
}

// Zatvaranje modalnog prozora
closeDeleteModal(): void {
  if (this.deleting) {
    return;
  }

  this.showDeleteModal = false;
  this.teamToDelete = null;
}

// Zatvaranje modala pritiskom na Escape
@HostListener('document:keydown.escape')
onEscapeKey(): void {
  if (this.showDeleteModal) {
    this.closeDeleteModal();
  }
}

// Konačna potvrda brisanja
confirmDeleteTeam(): void {
  if (!this.teamToDelete || this.deleting) {
    return;
  }

  const teamId = this.teamToDelete.id;

  this.deleting = true;
  this.clearMessages();

  this.teamService.delete(teamId).subscribe({

    next: () => {
      this.success = 'Tim je uspešno obrisan.';

      this.showDeleteModal = false;
      this.teamToDelete = null;
      this.deleting = false;

      this.loadTeams();
    },

    error: error => {
      console.error(error);

      this.error =
        error?.error?.message
        ?? 'Tim nije moguće obrisati.';

      this.deleting = false;
    }

  });
}

  clearMessages(): void {

    this.error = '';

    this.success = '';
  }

  private scrollToTeamForm(): void {
  setTimeout(() => {
    document.getElementById('team-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}
}