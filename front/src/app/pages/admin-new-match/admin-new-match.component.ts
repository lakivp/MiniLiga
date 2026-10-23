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
  Router,
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import {
  AdminMatchService,
  AdminMatchTeam,
  CompetitionPhase,
  CreateMatchRequest
} from '../../services/admin-match.service';

import {
  AdminCompetitionService,
  CompetitionGroup,
  GroupTeam
} from '../../services/admin-competition.service';


@Component({
  selector: 'app-admin-new-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl:
    './admin-new-match.component.html',
  styleUrl:
    './admin-new-match.component.scss'
})
export class AdminNewMatchComponent
  implements OnInit {


  // =========================================================
  // PODACI
  // =========================================================

  groupTeams: GroupTeam[] = [];

  teams: AdminMatchTeam[] = [];

  phases: CompetitionPhase[] = [];

  groups: CompetitionGroup[] = [];


  // =========================================================
  // STANJE
  // =========================================================

  loading = true;

  saving = false;

  error = '';

  success = '';
  lockPhaseSelection = false;


  // =========================================================
  // FORMA
  // =========================================================

  form = {

    phaseId: null as number | null,

    groupId: null as number | null,

    round: null as number | null,

    homeTeamId: null as number | null,

    awayTeamId: null as number | null,

    date: '',

    time: '',

    location: ''

  };


  // =========================================================
  // KONSTRUKTOR
  // =========================================================

  constructor(
    private matchService: AdminMatchService,
    private router: Router,
    private competitionService: AdminCompetitionService,
    private route: ActivatedRoute
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const groupId = Number(params['groupId']);
      const phaseId = Number(params['phaseId']);

      if (groupId > 0) {
        this.loadData(groupId, phaseId > 0 ? phaseId : null);
      } else {
        this.loadData(null, phaseId > 0 ? phaseId : null);
      }
    });
  }


  // =========================================================
  // UCITAVANJE OSNOVNIH PODATAKA
  // =========================================================

  loadData(
    groupId: number | null = null,
    phaseId: number | null = null
  ): void {
    this.loading = true;
    this.error = '';

    this.matchService.getTeams().subscribe({
      next: teams => {
        this.teams = teams;
        this.loadPhases(groupId, phaseId);
      },
      error: error => {
        console.error(error);
        this.error = 'Greška prilikom učitavanja timova.';
        this.loading = false;
      }
    });
  }


  // =========================================================
  // UCITAVANJE FAZA
  // =========================================================

  loadPhases(
    groupId: number | null = null,
    phaseId: number | null = null
  ): void {
    this.matchService.getPhases().subscribe({
      next: phases => {
        this.phases = phases;

        if (groupId) {
          this.loadInitialGroup(groupId);
          return;
        }

        if (phaseId) {
          const phaseExists = phases.some(
            phase => phase.id === phaseId
          );

          if (phaseExists) {
            this.form.phaseId = phaseId;
          } else {
            this.error = 'Izabrana faza ne postoji.';
          }
        }

        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.error = 'Greška prilikom učitavanja faza takmičenja.';
        this.loading = false;
      }
    });
  }


  // =========================================================
  // UCITAVANJE GRUPE IZ URL-a
  // =========================================================

  loadInitialGroup(
    groupId: number
  ): void {

    this.loading = true;


    this.competitionService
      .getGroup(groupId)
      .subscribe({

        next: group => {

          // -------------------------------------------------
          // Postavljamo fazu grupe
          // -------------------------------------------------

          this.form.phaseId =
            group.phaseId;


          // -------------------------------------------------
          // Učitavamo sve grupe te faze
          // -------------------------------------------------

          this.competitionService
            .getGroupsByPhase(group.phaseId)
            .subscribe({

              next: groups => {

                this.groups = groups;


                // -------------------------------------------
                // Postavljamo izabranu grupu
                // -------------------------------------------

                this.form.groupId =
                  groupId;


                // -------------------------------------------
                // Učitavamo timove grupe
                // -------------------------------------------

                this.loadTeamsForGroup(
                  groupId,
                  true
                );

              },

              error: error => {

                console.error(
                  'Greška prilikom učitavanja grupa:',
                  error
                );

                this.groups = [];

                this.error =
                  'Greška prilikom učitavanja grupa.';

                this.loading = false;

              }

            });

        },

        error: error => {

          console.error(
            'Greška prilikom učitavanja grupe:',
            error
          );

          this.error =
            'Izabrana grupa ne postoji ili nije dostupna.';

          this.loading = false;

        }

      });

  }


  // =========================================================
  // UČITAVANJE TIMOVA IZ GRUPE
  // =========================================================

  loadTeamsForGroup(
    groupId: number | null,
    keepSelection = false
  ): void {

    this.groupTeams = [];


    // Ako menjamo grupu ručno,
    // resetujemo prethodno izabrane timove.

    if (!keepSelection) {

      this.form.homeTeamId = null;

      this.form.awayTeamId = null;

    }


    if (!groupId) {

      this.loading = false;

      return;

    }


    this.competitionService
      .getGroupTeams(groupId)
      .subscribe({

        next: groupTeams => {

          this.groupTeams =
            groupTeams;

          this.loading = false;

        },

        error: error => {

          console.error(
            'Greška prilikom učitavanja timova grupe:',
            error
          );

          this.groupTeams = [];

          this.error =
            'Greška prilikom učitavanja timova grupe.';

          this.loading = false;

        }

      });

  }


  // =========================================================
  // PROMENA FAZE
  // =========================================================

  loadGroupsForPhase(
    phaseId: number | null
  ): void {

    // -------------------------------------------------------
    // Reset grupe i timova
    // -------------------------------------------------------

    this.groups = [];

    this.groupTeams = [];

    this.form.groupId = null;

    this.form.homeTeamId = null;

    this.form.awayTeamId = null;


    if (!phaseId) {

      return;

    }


    // -------------------------------------------------------
    // Pronalazimo fazu
    // -------------------------------------------------------

    const phase =
      this.phases.find(
        x => x.id === phaseId
      );


    // -------------------------------------------------------
    // Ako faza ne postoji
    // -------------------------------------------------------

    if (!phase) {

      return;

    }


    // -------------------------------------------------------
    // Knockout nema grupe
    // -------------------------------------------------------

    if (this.isKnockoutPhase(phase)) {

      return;

    }


    // -------------------------------------------------------
    // Učitavanje grupa
    // -------------------------------------------------------

    this.competitionService
      .getGroupsByPhase(phaseId)
      .subscribe({

        next: groups => {

          this.groups = groups;

        },

        error: error => {

          console.error(
            'Greška prilikom učitavanja grupa:',
            error
          );

          this.groups = [];

          this.error =
            'Greška prilikom učitavanja grupa.';

        }

      });

  }


  // =========================================================
  // PROMENA GRUPE
  // =========================================================

  onGroupChange(
    groupId: number | null
  ): void {

    this.form.groupId =
      groupId;

    this.loadTeamsForGroup(
      groupId
    );

  }


  // =========================================================
  // PROVERA DA LI JE FAZA KNOCKOUT
  // =========================================================

  isKnockoutPhase(
    phase: CompetitionPhase | null
  ): boolean {

    if (!phase) {

      return false;

    }

    return phase.type === 3;

  }


  // =========================================================
  // TRENUTNA FAZA
  // =========================================================

  get selectedPhase():
    CompetitionPhase | null {

    if (!this.form.phaseId) {

      return null;

    }

    return (
      this.phases.find(
        phase =>
          phase.id ===
          this.form.phaseId
      ) ?? null
    );

  }


  // =========================================================
  // DA LI TRENUTNA FAZA IMA GRUPE
  // =========================================================

  get phaseAllowsGroups(): boolean {

    const phase =
      this.selectedPhase;

    if (!phase) {

      return false;

    }

    // League = 0
    // Groups = 1
    // Playoff = 2
    //
    // Knockout = 3 nema grupe.

    return (
      phase.type === 0 ||
      phase.type === 1 ||
      phase.type === 2
    );

  }


  // =========================================================
  // IZABRANI HOME TIM
  // =========================================================

  get selectedHomeTeam():
    AdminMatchTeam | null {

    if (!this.form.homeTeamId) {

      return null;

    }

    return (
      this.teams.find(
        team =>
          team.id ===
          this.form.homeTeamId
      ) ?? null
    );

  }


  // =========================================================
  // IZABRANI AWAY TIM
  // =========================================================

  get selectedAwayTeam():
    AdminMatchTeam | null {

    if (!this.form.awayTeamId) {

      return null;

    }

    return (
      this.teams.find(
        team =>
          team.id ===
          this.form.awayTeamId
      ) ?? null
    );

  }


  // =========================================================
  // TIMOVI KOJI MOGU BITI U UTAKMICI
  // =========================================================

  get availableMatchTeams():
    AdminMatchTeam[] {

    // -------------------------------------------------------
    // Ako nema grupe:
    //
    // - Knockout
    // - ili faza još nije izabrana
    //
    // dostupni su svi timovi.
    // -------------------------------------------------------

    if (!this.form.groupId) {

      return this.teams;

    }


    // -------------------------------------------------------
    // Ako postoji grupa:
    // prikazujemo samo timove iz te grupe.
    // -------------------------------------------------------

    const groupTeamIds =
      new Set(
        this.groupTeams.map(
          team => team.teamId
        )
      );


    return this.teams.filter(
      team =>
        groupTeamIds.has(
          team.id
        )
    );

  }


  // =========================================================
  // AWAY TIMOVI
  // =========================================================

  get availableAwayTeams():
    AdminMatchTeam[] {

    return this.availableMatchTeams.filter(
      team =>
        team.id !==
        this.form.homeTeamId
    );

  }


  // =========================================================
  // PROMENA RUNDE
  // =========================================================

  adjustRound(
    change: number
  ): void {

    if (this.saving) {

      return;

    }

    this.form.round =
      Math.max(
        1,
        (this.form.round ?? 0) +
        change
      );

  }


  // =========================================================
  // KREIRANJE UTAKMICE
  // =========================================================

  createMatch(): void {

    this.error = '';

    this.success = '';


    // -------------------------------------------------------
    // Faza
    // -------------------------------------------------------

    if (!this.form.phaseId) {

      this.error =
        'Izaberi fazu takmičenja.';

      return;

    }


    const phase =
      this.selectedPhase;


    if (!phase) {

      this.error =
        'Izabrana faza ne postoji.';

      return;

    }


    // -------------------------------------------------------
    // Grupa
    // -------------------------------------------------------

    if (
      this.phaseAllowsGroups &&
      !this.form.groupId
    ) {

      this.error =
        'Izaberi grupu za ovu fazu.';

      return;

    }


    // -------------------------------------------------------
    // Home tim
    // -------------------------------------------------------

    if (!this.form.homeTeamId) {

      this.error =
        'Izaberi domaći tim.';

      return;

    }


    // -------------------------------------------------------
    // Away tim
    // -------------------------------------------------------

    if (!this.form.awayTeamId) {

      this.error =
        'Izaberi gostujući tim.';

      return;

    }


    // -------------------------------------------------------
    // Isti tim
    // -------------------------------------------------------

    if (
      this.form.homeTeamId ===
      this.form.awayTeamId
    ) {

      this.error =
        'Domaći i gostujući tim ne mogu biti isti.';

      return;

    }


    // -------------------------------------------------------
    // Datum
    // -------------------------------------------------------

    if (!this.form.date) {

      this.error =
        'Izaberi datum utakmice.';

      return;

    }


    // -------------------------------------------------------
    // Vreme
    // -------------------------------------------------------

    if (!this.form.time) {

      this.error =
        'Izaberi vreme utakmice.';

      return;

    }


    // -------------------------------------------------------
    // Ako je grupna utakmica:
    // timovi moraju pripadati grupi.
    // -------------------------------------------------------

    if (this.form.groupId) {

      const groupTeamIds =
        new Set(
          this.groupTeams.map(
            team => team.teamId
          )
        );


      if (
        !groupTeamIds.has(
          this.form.homeTeamId
        )
      ) {

        this.error =
          'Domaći tim ne pripada izabranoj grupi.';

        return;

      }


      if (
        !groupTeamIds.has(
          this.form.awayTeamId
        )
      ) {

        this.error =
          'Gostujući tim ne pripada izabranoj grupi.';

        return;

      }

    }


    // -------------------------------------------------------
    // Datum + vreme
    // -------------------------------------------------------

    const matchDate =
      `${this.form.date}T${this.form.time}:00`;


    // -------------------------------------------------------
    // Request
    // -------------------------------------------------------

    const request:
      CreateMatchRequest = {

      phaseId:
        this.form.phaseId,

      groupId:
        this.form.groupId,

      matchDate,

      round:
        this.form.round,

      location:
        this.form.location.trim()
          || null,

      home: {

        side: 0,

        teamId:
          this.form.homeTeamId,

        sourceType: 0

      },

      away: {

        side: 1,

        teamId:
          this.form.awayTeamId,

        sourceType: 0

      }

    };


    // -------------------------------------------------------
    // Slanje
    // -------------------------------------------------------

    this.saving = true;


    this.matchService
      .createMatch(request)
      .subscribe({

        next: response => {

          this.success =
            'Utakmica je uspešno kreirana.';

          this.saving = false;


          // Backend vraća MatchDto sa Id.
          const matchId =
            response.id;


          if (matchId) {

            setTimeout(() => {

              this.router.navigate([
                '/admin/utakmica',
                matchId
              ]);

            }, 500);

          } else {

            setTimeout(() => {

              this.router.navigate([
                '/admin/utakmice'
              ]);

            }, 700);

          }

        },

        error: error => {

          console.error(
            'Greška prilikom kreiranja utakmice:',
            error
          );


          this.error =
            error?.error?.message ??
            'Greška prilikom kreiranja utakmice.';


          this.saving = false;

        }

      });

  }


  // =========================================================
  // INICIJAL TIMA
  // =========================================================

  getTeamInitial(
    team: AdminMatchTeam | null
  ): string {

    return (
      team?.name
        ?.charAt(0)
        .toUpperCase()
      ?? '?'
    );

  }


  // =========================================================
  // BRISANJE GREŠKE
  // =========================================================

  clearError(): void {

    this.error = '';

  }


  // =========================================================
  // NAZIV IZABRANE FAZE
  // =========================================================

  getSelectedPhaseName(): string {

    const phase =
      this.phases.find(
        phase =>
          phase.id ===
          this.form.phaseId
      );


    return (
      phase?.name ??
      'Nije izabrana'
    );

  }


  // =========================================================
  // NAZIV HOME TIMA
  // =========================================================

  getSelectedHomeTeamName(): string {

    const team =
      this.teams.find(
        team =>
          team.id ===
          this.form.homeTeamId
      );


    return (
      team?.name ??
      'Nije izabran'
    );

  }


  // =========================================================
  // NAZIV AWAY TIMA
  // =========================================================

  getSelectedAwayTeamName(): string {

    const team =
      this.teams.find(
        team =>
          team.id ===
          this.form.awayTeamId
      );


    return (
      team?.name ??
      'Nije izabran'
    );

  }

}
