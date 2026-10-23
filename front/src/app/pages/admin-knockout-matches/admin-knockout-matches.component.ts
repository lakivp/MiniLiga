
import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  AdminMatch,
  AdminMatchService
} from '../../services/admin-match.service';

import {
  AdminCompetitionService
} from '../../services/admin-competition.service';

@Component({
  selector: 'app-admin-knockout-matches',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-knockout-matches.component.html',
  styleUrl: './admin-knockout-matches.component.css'
})
export class AdminKnockoutMatchesComponent implements OnInit {

  phaseId = 0;
  phaseName = 'Knockout faza';

  matches: AdminMatch[] = [];

    // Filter po statusu utakmice
  statusFilter: 'all' | 'scheduled' | 'finished' = 'all';

  // Pretraga po imenu domaćeg ili gostujućeg tima
  searchTerm = '';

  // Paginacija
  currentPage = 1;
  pageSize = 9;

  loading = true;
  deletingMatch = false;

  error = '';
  success = '';

  matchToDelete: AdminMatch | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: AdminMatchService,
    private competitionService: AdminCompetitionService
  ) {}

  ngOnInit(): void {
    const phaseId = Number(
      this.route.snapshot.queryParamMap.get('phaseId')
    );

    this.phaseName =
      this.route.snapshot.queryParamMap.get('phaseName')?.trim()
      || 'Knockout faza';

    if (!Number.isInteger(phaseId) || phaseId <= 0) {
      this.error = 'ID knockout faze nije validan.';
      this.loading = false;
      return;
    }

    this.phaseId = phaseId;
    this.loadMatches();
  }

  loadMatches(): void {
    this.loading = true;
    this.error = '';

    this.matchService.getAll().subscribe({
      next: (matches: AdminMatch[]) => {
        this.matches = matches
          .filter(match => match.phaseId === this.phaseId)
          .sort(
            (a, b) =>
              new Date(a.matchDate).getTime() -
              new Date(b.matchDate).getTime()
          );

        this.currentPage = 1;
        this.loading = false;
      },

      error: (err: HttpErrorResponse) => {
        console.error('Greška pri učitavanju utakmica:', err);

        this.matches = [];
        this.error =
          err.error?.message ??
          'Greška pri učitavanju utakmica ove faze.';

        this.loading = false;
      }
    });
  }

  createMatch(): void {
    this.router.navigate(
      ['/admin/utakmice/nova'],
      {
        queryParams: {
          phaseId: this.phaseId
        }
      }
    );
  }

  openMatch(matchId: number): void {
    this.router.navigate([
      '/admin/utakmica',
      matchId
    ]);
  }

  canDeleteMatch(match: AdminMatch): boolean {
    return match.status === 0 && !match.isLive;
  }

  requestDeleteMatch(
    event: MouseEvent,
    match: AdminMatch
  ): void {
    event.stopPropagation();

    if (!this.canDeleteMatch(match) || this.deletingMatch) {
      return;
    }

    this.error = '';
    this.success = '';
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

    if (
      !match ||
      !this.canDeleteMatch(match) ||
      this.deletingMatch
    ) {
      return;
    }

    this.deletingMatch = true;

    this.matchService.deleteMatch(match.id).subscribe({
      next: () => {
        this.matches = this.matches.filter(
          item => item.id !== match.id
        );

        // Ako je obrisana poslednja utakmica na stranici,
        // vrati se na prethodnu postojeću stranicu.
        if (this.currentPage > Math.max(1, this.totalPages)) {
          this.currentPage = Math.max(1, this.totalPages);
        }

        this.success = 'Zakazana utakmica je uspešno obrisana.';
        this.matchToDelete = null;
        this.deletingMatch = false;
      },

      error: (err: HttpErrorResponse) => {
        console.error('Greška pri brisanju utakmice:', err);

        this.error =
          err.error?.message ??
          'Zakazanu utakmicu nije moguće obrisati.';

        this.matchToDelete = null;
        this.deletingMatch = false;
      }
    });
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

  hasMatchStarted(match: AdminMatch): boolean {
    return match.isLive ||
      match.status === 1 ||
      match.status === 2;
  }

  formatMatchDate(date: string): string {
    return new Date(date).toLocaleDateString(
      'sr-RS',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    );
  }

  formatMatchTime(date: string): string {
    return new Date(date).toLocaleTimeString(
      'sr-RS',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  goBackToCompetition(): void {
    this.competitionService.getPhase(this.phaseId).subscribe({
      next: phase => {
        this.router.navigate([
          '/admin/takmicenje',
          phase.competitionId
        ]);
      },

      error: (err: HttpErrorResponse) => {
        console.error('Greška pri pronalaženju takmičenja:', err);

        this.router.navigate(['/admin/takmicenja']);
      }
    });
  }

  // Filtrirane utakmice prema statusu i nazivu tima
  get filteredMatches(): AdminMatch[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('sr-RS');

    return this.matches.filter(match => {
      // Filter po statusu
      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'scheduled' &&
          match.status === 0 &&
          !match.isLive) ||
        (this.statusFilter === 'finished' &&
          match.status === 2);

      // Pretraga po imenima timova
      const homeTeamName = (match.homeTeam?.name ?? '')
        .toLocaleLowerCase('sr-RS');

      const awayTeamName = (match.awayTeam?.name ?? '')
        .toLocaleLowerCase('sr-RS');

      const matchesSearch =
        !search ||
        homeTeamName.includes(search) ||
        awayTeamName.includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  // Broj stranica na osnovu filtriranih rezultata
  get totalPages(): number {
    return Math.ceil(this.filteredMatches.length / this.pageSize);
  }

  // Utakmice koje treba prikazati na trenutnoj stranici
  get paginatedMatches(): AdminMatch[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredMatches.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  get paginationItems(): (number | 'dots')[] {
    return this.getPaginationItems(
      this.totalPages,
      this.currentPage
    );
  }

  private getPaginationItems(
    totalPages: number,
    currentPage: number
  ): (number | 'dots')[] {

    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const items: (number | 'dots')[] = [];

    // Prikaži prvu stranicu.
    items.push(1);

    // Stranice na početku.
    if (currentPage <= 2) {
      items.push(2, 3);

      if (totalPages > 4) {
        items.push(4);
      }

      if (totalPages > 5) {
        items.push('dots');
      }

      items.push(totalPages);
      return items;
    }

    // Stranice na kraju.
    if (currentPage >= totalPages - 2) {
      items.push('dots');

      for (
        let page = totalPages - 3;
        page <= totalPages;
        page++
      ) {
        if (page > 1) {
          items.push(page);
        }
      }

      return items;
    }

    // Sredina: prethodna, trenutna i sledeća stranica.
    items.push('dots');
    items.push(currentPage - 1);
    items.push(currentPage);
    items.push(currentPage + 1);
    items.push('dots');
    items.push(totalPages);

    return items;
  }

  // Ukupan broj filtriranih utakmica
  get filteredMatchesCount(): number {
    return this.filteredMatches.length;
  }

  // Prvi prikazani rezultat
  get firstVisibleMatch(): number {
    return this.filteredMatchesCount === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  // Poslednji prikazani rezultat
  get lastVisibleMatch(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredMatchesCount
    );
  }

  // Promena statusnog filtera
  setStatusFilter(
    status: 'all' | 'scheduled' | 'finished'
  ): void {
    this.statusFilter = status;
    this.currentPage = 1;
  }

  // Promena teksta pretrage
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  // Prelazak na određenu stranicu
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  // Prethodna stranica
  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // Sledeća stranica
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}
