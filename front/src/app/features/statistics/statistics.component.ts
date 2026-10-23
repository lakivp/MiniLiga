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
  PublicStatisticsService,
  PublicCompetitionOption,
  PublicPlayerStatistic,
  PublicStatisticsResponse
} from '../../services/public-statistics.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-statistics',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './statistics.component.html',

  styleUrl:
    './statistics.component.css'
})
export class StatisticsComponent
  implements OnInit {

  readonly pageSize = 8;

  scorersPage = 1;

  assistsPage = 1;

  competitions:
    PublicCompetitionOption[] = [];

  selectedCompetitionId:
    number | null = null;

  statistics:
    PublicStatisticsResponse | null = null;

  loadingCompetitions = false;

  loadingStatistics = false;

  errorMessage = '';


  constructor(
    private statisticsService:
      PublicStatisticsService
  ) {}


  ngOnInit(): void {

    this.loadCompetitions();

  }


  // =========================================================
  // UČITAJ TAKMIČENJA
  // =========================================================

  loadCompetitions(): void {

    this.loadingCompetitions = true;

    this.errorMessage = '';

    this.statisticsService
      .getActiveCompetitions()
      .subscribe({

        next: competitions => {

          this.competitions =
            competitions;

          this.loadingCompetitions =
            false;


          // -------------------------------------------------
          // PRVO AKTIVNO TAKMIČENJE PO ID-U
          // -------------------------------------------------

          if (
            this.competitions.length === 0
          ) {

            this.selectedCompetitionId =
              null;

            this.statistics = null;

            return;
          }


          const firstCompetition =
            this.competitions
              .slice()
              .sort(
                (a, b) =>
                  a.id - b.id
              )[0];


          this.selectedCompetitionId =
            firstCompetition.id;


          this.loadStatistics(
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
            'Takmičenja trenutno nije moguće učitati.';
        }

      });
  }


  // =========================================================
  // PROMENA TAKMIČENJA
  // =========================================================

  onCompetitionChange(): void {

    if (
      !this.selectedCompetitionId
    ) {
      return;
    }

    this.scorersPage = 1;
    this.assistsPage = 1;

    this.loadStatistics(
      this.selectedCompetitionId
    );
  }


  // =========================================================
  // UČITAJ STATISTIKU
  // =========================================================

  loadStatistics(
    competitionId: number
  ): void {

    this.loadingStatistics = true;

    this.errorMessage = '';

    this.statisticsService
      .getStatistics(
        competitionId
      )
      .subscribe({

        next: response => {

          this.statistics =
            response;

          this.scorersPage = 1;
          this.assistsPage = 1;

          this.loadingStatistics =
            false;
        },

        error: error => {

          console.error(
            'Greška pri učitavanju statistike:',
            error
          );

          this.statistics =
            null;

          this.loadingStatistics =
            false;

          this.errorMessage =
            error?.error?.message ??
            'Statistiku trenutno nije moguće učitati.';
        }

      });
  }


  // =========================================================
  // IME IGRAČA
  // =========================================================

  getPlayerInitials(
    player: PublicPlayerStatistic
  ): string {

    if (!player.playerName) {
      return '?';
    }


    const parts =
      player.playerName
        .trim()
        .split(/\s+/);


    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }


    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  // =========================================================
  // SLIKA IGRAČA
  // =========================================================

  getPlayerPhotoUrl(
    photoUrl: string | null
  ): string {

    if (!photoUrl) {
      return '';
    }


    if (
      photoUrl.startsWith('http://') ||
      photoUrl.startsWith('https://')
    ) {
      return photoUrl;
    }


    return `${environment.apiUrl.replace('/api', '')}${photoUrl}`;
  }


  // =========================================================
  // LOGO TIMA
  // =========================================================

  getTeamLogoUrl(
    logoUrl: string | null
  ): string {

    if (!logoUrl) {
      return '';
    }


    if (
      logoUrl.startsWith('http://') ||
      logoUrl.startsWith('https://')
    ) {
      return logoUrl;
    }


    return `${environment.apiUrl.replace('/api', '')}${logoUrl}`;
  }


  // =========================================================
  // EMPTY
  // =========================================================

  get hasScorers(): boolean {

    return !!(
      this.statistics &&
      this.statistics.topScorers.length
    );
  }


  get hasAssists(): boolean {

    return !!(
      this.statistics &&
      this.statistics.topAssists.length
    );
  }

  get paginatedScorers(): PublicPlayerStatistic[] {
    const players = this.statistics?.topScorers ?? [];
    const start = (this.scorersPage - 1) * this.pageSize;
    return players.slice(start, start + this.pageSize);
  }

  get paginatedAssists(): PublicPlayerStatistic[] {
    const players = this.statistics?.topAssists ?? [];
    const start = (this.assistsPage - 1) * this.pageSize;
    return players.slice(start, start + this.pageSize);
  }

  get scorersTotalPages(): number {
    return Math.ceil((this.statistics?.topScorers.length ?? 0) / this.pageSize);
  }

  get assistsTotalPages(): number {
    return Math.ceil((this.statistics?.topAssists.length ?? 0) / this.pageSize);
  }

  get scorersPaginationItems(): (number | 'ellipsis')[] {
    return this.getPaginationItems(this.scorersTotalPages, this.scorersPage);
  }

  get assistsPaginationItems(): (number | 'ellipsis')[] {
    return this.getPaginationItems(this.assistsTotalPages, this.assistsPage);
  }

  goToScorersPage(page: number): void {
    if (page >= 1 && page <= this.scorersTotalPages) {
      this.scorersPage = page;
    }
  }

  goToAssistsPage(page: number): void {
    if (page >= 1 && page <= this.assistsTotalPages) {
      this.assistsPage = page;
    }
  }

  private getPaginationItems(
    totalPages: number,
    currentPage: number
  ): (number | 'ellipsis')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const middleStart = currentPage <= 3
      ? 1
      : currentPage >= totalPages - 2
        ? totalPages - 2
        : currentPage - 1;
    const middleEnd = Math.min(totalPages, middleStart + 2);
    const items: (number | 'ellipsis')[] = [];

    if (middleStart > 1) {
      items.push(1);
      if (middleStart > 2) items.push('ellipsis');
    }

    for (let page = middleStart; page <= middleEnd; page++) {
      if (!items.includes(page)) items.push(page);
    }

    if (middleEnd < totalPages) {
      if (middleEnd < totalPages - 1) items.push('ellipsis');
      items.push(totalPages);
    }

    return items;
  }
}