import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminCompetition,
  AdminSeasonOption,
  CreateAdminCompetitionRequest,
  CreateAdminSeasonRequest,
  AdminCompetitionService
} from '../../services/admin-competition.service';

@Component({
  selector: 'app-admin-competitions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-competitions.component.html',
  styleUrl: './admin-competitions.component.css'
})
export class AdminCompetitionsComponent implements OnInit {

  competitions: AdminCompetition[] = [];
  seasons: AdminSeasonOption[] = [];
  loading = true;
  loadingSeasons = false;
  saving = false;
  savingArchiveId: number | null = null;
  deletingCompetition = false;
  error = '';
  success = '';
  formError = '';
  actionError = '';
  searchTerm = '';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  showCreateForm = false;
  createNewSeason = false;
  competitionToDelete: AdminCompetition | null = null;
  competitionForm = {
    seasonId: null as number | null,
    name: '',
    description: '',
    isActive: true
  };
  seasonForm = {
    name: '',
    startDate: this.getLocalToday()
  };

  constructor(
    private competitionService: AdminCompetitionService
  ) {}

  ngOnInit(): void {
    this.loadCompetitions();
    this.loadSeasons();
  }

  loadCompetitions(): void {
    this.loading = true;
    this.error = '';

    this.competitionService.getCompetitions().subscribe({
      next: competitions => {
        this.competitions = competitions;
        this.loading = false;
      },
      error: error => {
        console.error('Greška pri učitavanju takmičenja:', error);
        this.error = error?.error?.message
          ?? 'Greška prilikom učitavanja takmičenja.';
        this.loading = false;
      }
    });
  }

  loadSeasons(): void {
    this.loadingSeasons = true;

    this.competitionService.getSeasons().subscribe({
      next: seasons => {
        this.seasons = seasons;
        this.loadingSeasons = false;

        if (this.showCreateForm && !this.competitionForm.seasonId) {
          this.competitionForm.seasonId = seasons[0]?.id ?? null;
        }
      },
      error: error => {
        console.error('Greška pri učitavanju sezona:', error);
        this.formError = error?.error?.message
          ?? 'Greška prilikom učitavanja sezona.';
        this.loadingSeasons = false;
      }
    });
  }

  openCreateForm(): void {
    this.formError = '';
    this.createNewSeason = true; // uvek nova sezona

    this.competitionForm = {
      seasonId: null,
      name: '',
      description: '',
      isActive: true
    };

    this.seasonForm = {
      name: '',
      startDate: this.getLocalToday()
    };

    this.showCreateForm = true;

    if (this.seasons.length === 0 && !this.loadingSeasons) {
      this.loadSeasons();
    }
  }


  closeCreateForm(): void {
    if (this.saving) {
      return;
    }

    this.showCreateForm = false;
    this.formError = '';
  }

  selectSeasonMode(createNewSeason: boolean): void {
    this.createNewSeason = createNewSeason;
    this.formError = '';

    if (!createNewSeason && !this.competitionForm.seasonId) {
      this.competitionForm.seasonId = this.seasons[0]?.id ?? null;
    }
  }

  createCompetition(): void {
    this.formError = '';

    if (!this.competitionForm.name.trim()) {
      this.formError = 'Naziv takmičenja je obavezan.';
      return;
    }

    this.saving = true;

    if (this.createNewSeason) {
      this.createSeasonAndCompetition();
      return;
    }

    if (!this.competitionForm.seasonId) {
      this.saving = false;
      this.formError = 'Izaberi sezonu.';
      return;
    }

    this.saveCompetition(this.competitionForm.seasonId);
  }

  private createSeasonAndCompetition(): void {
    const seasonName = this.seasonForm.name.trim();
    const seasonNumber = this.getNextSeasonNumber();

    if (!seasonName) {
      this.saving = false;
      this.formError = 'Naziv sezone je obavezan.';
      return;
    }

    const request: CreateAdminSeasonRequest = {
      name: seasonName,
      number: seasonNumber,
      startDate: new Date(`${this.seasonForm.startDate}T12:00:00`).toISOString(),
      endDate: null,
      isActive: true,
      description: null
    };

    this.competitionService.createSeason(request).subscribe({
      next: season => {
        this.seasons = [season, ...this.seasons];
        this.competitionForm.seasonId = season.id;
        this.createNewSeason = false;
        this.saveCompetition(season.id);
      },
      error: error => {
        console.error('Greška pri kreiranju sezone:', error);
        this.formError = error?.error?.message
          ?? 'Greška prilikom kreiranja sezone.';
        this.saving = false;
      }
    });
  }

  private saveCompetition(seasonId: number): void {
    const request: CreateAdminCompetitionRequest = {
      seasonId,
      name: this.competitionForm.name.trim(),
      description: this.competitionForm.description.trim() || null,
      isActive: this.competitionForm.isActive
    };

    this.competitionService.createCompetition(request).subscribe({
      next: () => {
        this.saving = false;
        this.showCreateForm = false;
        this.success = 'Takmičenje je uspešno dodato.';
        this.loadCompetitions();
      },
      error: error => {
        console.error('Greška pri kreiranju takmičenja:', error);
        this.formError = error?.error?.message
          ?? 'Greška prilikom kreiranja takmičenja.';
        this.saving = false;
      }
    });
  }

  toggleArchive(competition: AdminCompetition): void {
    if (this.savingArchiveId !== null) {
      return;
    }

    this.actionError = '';
    this.savingArchiveId = competition.id;

    this.competitionService.updateCompetition(competition.id, {
      seasonId: competition.seasonId,
      name: competition.name,
      description: competition.description,
      isActive: !competition.isActive
    }).subscribe({
      next: () => {
        competition.isActive = !competition.isActive;
        this.success = competition.isActive
          ? 'Takmičenje je ponovo aktivirano.'
          : 'Takmičenje je arhivirano.';
        this.savingArchiveId = null;
      },
      error: error => {
        console.error('Greška pri promeni statusa takmičenja:', error);
        this.actionError = error?.error?.message
          ?? 'Status takmičenja nije moguće promeniti.';
        this.savingArchiveId = null;
      }
    });
  }

  openDeleteConfirmation(competition: AdminCompetition): void {
    this.actionError = '';
    this.competitionToDelete = competition;
  }

  closeDeleteConfirmation(): void {
    if (this.deletingCompetition) {
      return;
    }

    this.competitionToDelete = null;
  }

  confirmDeleteCompetition(): void {
    if (!this.competitionToDelete || this.deletingCompetition) {
      return;
    }

    const competition = this.competitionToDelete;
    this.deletingCompetition = true;

    this.competitionService.deleteCompetition(competition.id).subscribe({
      next: () => {
        this.competitions = this.competitions.filter(
          item => item.id !== competition.id
        );
        this.competitionToDelete = null;
        this.deletingCompetition = false;
        this.success = `Takmičenje „${competition.name}“ i njegova struktura su obrisani.`;
      },
      error: error => {
        console.error('Greška pri brisanju takmičenja:', error);
        this.actionError = error?.error?.message
          ?? 'Takmičenje nije moguće obrisati.';
        this.competitionToDelete = null;
        this.deletingCompetition = false;
      }
    });
  }

  private getLocalToday(): string {
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60_000
    );
    return localDate.toISOString().slice(0, 10);
  }

  private getNextSeasonNumber(): number {
    return this.seasons.reduce(
      (highestNumber, season) =>
        Math.max(highestNumber, season.number),
      0
    ) + 1;
  }

  get filteredCompetitions(): AdminCompetition[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('sr-RS');

    return this.competitions.filter(competition => {
      const matchesSearch = !search ||
        competition.name.toLocaleLowerCase('sr-RS').includes(search) ||
        competition.seasonName.toLocaleLowerCase('sr-RS').includes(search) ||
        (competition.description ?? '').toLocaleLowerCase('sr-RS').includes(search);

      const matchesStatus = this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && competition.isActive) ||
        (this.selectedStatus === 'inactive' && !competition.isActive);

      return matchesSearch && matchesStatus;
    });
  }

  get activeCount(): number {
    return this.competitions.filter(competition => competition.isActive).length;
  }

  get inactiveCount(): number {
    return this.competitions.length - this.activeCount;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
  }
}
