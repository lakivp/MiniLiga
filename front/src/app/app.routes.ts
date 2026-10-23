import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './core/layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { adminGuard } from './services/admin.guard';


export const routes: Routes = [

  // =========================================================
  // PUBLIC WEBSITE
  // =========================================================

  {
    path: '',
    component: PublicLayoutComponent,

    children: [

      // -------------------------------------------------------
      // POČETNA
      // -------------------------------------------------------

      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component')
            .then(m => m.HomeComponent),

        title: 'Intertoto | Početna'
      },

      // -------------------------------------------------------
      // RASPORED
      // -------------------------------------------------------

      {
        path: 'raspored',
        loadComponent: () =>
          import('./features/schedule/schedule.component')
            .then(m => m.ScheduleComponent),

        title: 'Intertoto | Raspored'
      },

      // -------------------------------------------------------
      // REZULTATI
      // -------------------------------------------------------

      {
        path: 'rezultati',
        loadComponent: () =>
          import('./features/results/results.component')
            .then(m => m.ResultsComponent),

        title: 'Intertoto | Rezultati'
      },

      // -------------------------------------------------------
      // TABELA
      // -------------------------------------------------------

      {
        path: 'tabela',
        loadComponent: () =>
          import('./features/standings/standings.component')
            .then(m => m.StandingsComponent),

        title: 'Intertoto | Tabela'
      },

      // -------------------------------------------------------
      // STATISTIKA
      // -------------------------------------------------------

      {
        path: 'statistika',
        loadComponent: () =>
          import('./features/statistics/statistics.component')
            .then(m => m.StatisticsComponent),

        title: 'Intertoto | Statistika'
      },

      // -------------------------------------------------------
      // VESTI
      // -------------------------------------------------------

      {
        path: 'news',
        loadComponent: () =>
          import('./features/news/news.component')
            .then(m => m.NewsComponent),

        title: 'Intertoto | Vesti'
      },

      // -------------------------------------------------------
      // DETALJI VESTI
      // -------------------------------------------------------

      {
        path: 'news/:id',
        loadComponent: () =>
          import('./features/news-details/news-details.component')
            .then(m => m.NewsDetailsComponent),

        title: 'Intertoto | Vesti'
      },

      // -------------------------------------------------------
      // KONTAKT
      // -------------------------------------------------------

      {
        path: 'kontakt',
        loadComponent: () =>
          import('./features/contact/contact.component')
            .then(m => m.ContactComponent),

        title: 'Intertoto | Kontakt'
      },

      // -------------------------------------------------------
      // JAVNI DETALJI UTAKMICE
      // -------------------------------------------------------

      {
        path: 'utakmica/:id',
        loadComponent: () =>
          import('./pages/match-details/match-details.component')
            .then(m => m.MatchDetailsComponent),

        title: 'Intertoto | Utakmica'
      }

    ]
  },


  // =========================================================
  // ADMIN LOGIN
  //
  // NAMERNO JE VAN PUBLIC LAYOUT-A
  //
  // NEMA:
  // - Public Header
  // - Public Footer
  // =========================================================

  {
    path: 'admin/login',

    loadComponent: () =>
      import('./pages/admin-login/admin-login.component')
        .then(m => m.AdminLoginComponent),

    title: 'Intertoto | Login'
  },


  // =========================================================
  // ADMIN PANEL
  //
  // NAMERNO JE VAN PUBLIC LAYOUT-A
  //
  // IMA:
  // - Admin Navbar
  //
  // NEMA:
  // - Public Header
  // - Public Footer
  //
  // ZAŠTIĆENO:
  // - adminGuard
  // =========================================================

  {
    path: 'admin',

    component: AdminLayoutComponent,

    canActivate: [
      adminGuard
    ],

    children: [

      // -------------------------------------------------------
      // ADMIN DASHBOARD
      // -------------------------------------------------------

      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),

        title: 'Intertoto | Admin'
      },

      // -------------------------------------------------------
      // ADMIN - UTAKMICA
      // -------------------------------------------------------

      {
        path: 'utakmica/:id',
        loadComponent: () =>
          import('./pages/admin-match/admin-match.component')
            .then(m => m.AdminMatchComponent),

        title: 'Intertoto | Admin | Utakmica'
      },

      // -------------------------------------------------------
      // ADMIN - SASTAV
      // -------------------------------------------------------

      {
        path: 'utakmica/:id/sastav',
        loadComponent: () =>
          import('./pages/admin-match-lineup/admin-match-lineup.component')
            .then(m => m.AdminMatchLineupComponent),

        title: 'Intertoto | Admin | Sastav'
      },

      // -------------------------------------------------------
      // ADMIN - TIMOVI
      // -------------------------------------------------------

      {
        path: 'timovi',
        loadComponent: () =>
          import('./pages/admin-teams/admin-teams.component')
            .then(m => m.AdminTeamsComponent),

        title: 'Intertoto | Admin | Timovi'
      },

      // -------------------------------------------------------
      // ADMIN - IGRAČI TIMA
      // -------------------------------------------------------

      {
        path: 'timovi/:id/igraci',
        loadComponent: () =>
          import('./pages/admin-team-players/admin-team-players.component')
            .then(m => m.AdminTeamPlayersComponent),

        title: 'Intertoto | Admin | Igrači'
      },

      // -------------------------------------------------------
      // ADMIN - UTAKMICE
      // -------------------------------------------------------

      {
        path: 'utakmice',
        loadComponent: () =>
          import('./pages/admin-matches/admin-matches.component')
            .then(m => m.AdminMatchesComponent),

        title: 'Intertoto | Admin | Utakmice'
      },

      // -------------------------------------------------------
      // ADMIN - NOVA UTAKMICA
      // -------------------------------------------------------

      {
        path: 'utakmice/nova',
        loadComponent: () =>
          import('./pages/admin-new-match/admin-new-match.component')
            .then(m => m.AdminNewMatchComponent),

        title: 'Intertoto | Admin | Nova utakmica'
      },

      // -------------------------------------------------------
      // ADMIN - TAKMIČENJA
      // -------------------------------------------------------

      {
        path: 'takmicenja',
        loadComponent: () =>
          import('./pages/admin-competitions/admin-competitions.component')
            .then(m => m.AdminCompetitionsComponent),

        title: 'Intertoto | Admin | Takmičenja'
      },

      // -------------------------------------------------------
      // ADMIN - TAKMIČENJE
      // -------------------------------------------------------

      {
        path: 'takmicenje/:id',
        loadComponent: () =>
          import('./pages/admin-competition/admin-competition.component')
            .then(m => m.AdminCompetitionComponent),

        title: 'Intertoto | Admin | Takmičenje'
      },

      // -------------------------------------------------------
      // ADMIN - GRUPA
      // -------------------------------------------------------

      {
        path: 'grupa/:id',
        loadComponent: () =>
          import('./pages/admin-group/admin-group.component')
            .then(m => m.AdminGroupComponent),

        title: 'Intertoto | Admin | Grupa'
      },

      {
        path: 'knockout-utakmice',
        loadComponent: () =>
          import('./pages/admin-knockout-matches/admin-knockout-matches.component')
            .then(m => m.AdminKnockoutMatchesComponent),

        title: 'Intertoto | Admin | Knockout'
      },


      // -------------------------------------------------------
      // ADMIN - VESTI
      // -------------------------------------------------------

      {
        path: 'news',
        loadComponent: () =>
          import('./pages/admin-news/admin-news.component')
            .then(m => m.AdminNewsComponent),

        title: 'Intertoto | Admin | Vesti'
      }

    ]
  },


  // =========================================================
  // 404
  // =========================================================

  {
    path: '**',
    redirectTo: ''
  }

];