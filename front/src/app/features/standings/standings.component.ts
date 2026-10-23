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
  PublicStandingsService,
  PublicStandingsCompetition,
  PublicStandingsResponse,
  PublicStandingsPhase,
  PublicStandingsTable,
  PublicStandingTeam
} from '../../services/public-standings.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-standings',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './standings.component.html',

  styleUrl:
    './standings.component.css'
})
export class StandingsComponent
  implements OnInit {


  competitions:
    PublicStandingsCompetition[] = [];


  selectedCompetitionId:
    number | null = null;


  standings:
    PublicStandingsResponse | null = null;


  loadingCompetitions = false;

  loadingStandings = false;

  errorMessage = '';


  constructor(
    private standingsService:
      PublicStandingsService
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


    this.standingsService
      .getActiveCompetitions()
      .subscribe({

        next: competitions => {

          this.competitions =
            competitions
              .slice()
              .sort(
                (a, b) =>
                  a.id - b.id
              );


          this.loadingCompetitions =
            false;


          // -----------------------------------------------
          // PRVO AKTIVNO TAKMIČENJE PO ID-U
          // -----------------------------------------------

          if (
            this.competitions.length === 0
          ) {

            this.selectedCompetitionId =
              null;

            this.standings = null;

            return;
          }


          this.selectedCompetitionId =
            this.competitions[0].id;


          this.loadStandings(
            this.selectedCompetitionId
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


    this.loadStandings(
      this.selectedCompetitionId
    );
  }


  // =========================================================
  // UČITAJ TABELU
  // =========================================================

  loadStandings(
    competitionId: number
  ): void {

    this.loadingStandings = true;

    this.errorMessage = '';


    this.standingsService
      .getStandings(
        competitionId
      )
      .subscribe({

        next: response => {

          this.standings =
            response;

          this.loadingStandings =
            false;
        },


        error: error => {

          console.error(
            'Greška pri učitavanju tabele:',
            error
          );


          this.standings =
            null;

          this.loadingStandings =
            false;


          this.errorMessage =
            error?.error?.message ??
            'Tabelu trenutno nije moguće učitati.';
        }

      });
  }


  // =========================================================
  // DA LI JE PLAYOFF
  // =========================================================

  isPlayoff(
    phase: PublicStandingsPhase
  ): boolean {

    return phase.type === 2;
  }


  // =========================================================
  // DA LI JE LIGA
  // =========================================================

  isLeague(
    phase: PublicStandingsPhase
  ): boolean {

    return phase.type === 0;
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
  // INICIJALI TIMA
  // =========================================================

  getTeamInitials(
    team: PublicStandingTeam
  ): string {

    const name =
      team.shortName ||
      team.teamName;


    if (!name) {
      return '?';
    }


    const parts =
      name
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
  // GOAL DIFFERENCE
  // =========================================================

  formatGoalDifference(
    value: number
  ): string {

    if (value > 0) {
      return `+${value}`;
    }


    return `${value}`;
  }


  // =========================================================
  // UKUPAN BROJ TIMOVA
  // =========================================================

  getTeamCount(
    table: PublicStandingsTable
  ): number {

    return table.teams.length;
  }


  // =========================================================
  // UKUPAN BROJ ODIGRANIH
  // =========================================================

  getPlayedMatches(
    table: PublicStandingsTable
  ): number {

    return Math.floor(
      table.teams.reduce(
        (total, team) =>
          total + team.played,
        0
      ) / 2
    );
  }
}