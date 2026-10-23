
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatchService } from '../../services/match.service';
import { LiveMatchService } from '../../services/live-match.service';

@Component({
  selector: 'app-match-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-details.component.html',
  styleUrl: './match-details.component.scss'
})
export class MatchDetailsComponent implements OnInit, OnDestroy {
  match: any = null;
  loading = true;
  error = '';

  private readonly destroy$ = new Subject<void>();
  private matchId = 0;

  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private liveMatchService: LiveMatchService
  ) {}

  async ngOnInit(): Promise<void> {
    this.matchId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(this.matchId) || this.matchId <= 0) {
      this.error = 'Neispravan ID utakmice.';
      this.loading = false;
      return;
    }

    // Pretplate moraju biti aktivne pre pridruživanja grupi.
    this.subscribeToLiveUpdates(this.matchId);

    try {
      await this.liveMatchService.joinMatch(this.matchId);
    } catch (error) {
      console.error('SignalR povezivanje nije uspelo:', error);
    }

    // U svakom slučaju učitaj trenutno stanje iz baze preko API-ja.
    if (!this.destroy$.closed) {
      this.loadMatch(this.matchId);
    }
  }

  // ============================================================
  // UČITAVANJE UTAKMICE
  // ============================================================

  loadMatch(matchId: number): void {
    this.matchService
      .getMatchDetails(matchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.match = data;
          this.loading = false;
          this.error = '';
        },
        error: error => {
          console.error('Greška pri učitavanju utakmice:', error);

          if (!this.match) {
            this.error = 'Greška prilikom učitavanja utakmice.';
          }

          this.loading = false;
        }
      });
  }

  // ============================================================
  // SIGNALR PRETPLATE
  // ============================================================

  private subscribeToLiveUpdates(matchId: number): void {
    this.liveMatchService.matchUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.matchId !== matchId) {
          return;
        }

        console.log('MatchUpdated — osvežavam utakmicu:', matchId);
        this.loadMatch(matchId);
      });

    this.liveMatchService.matchStarted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.matchId !== matchId) {
          return;
        }

        console.log('MatchStarted — osvežavam utakmicu:', matchId);
        this.loadMatch(matchId);
      });

    this.liveMatchService.matchFinished$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.matchId !== matchId) {
          return;
        }

        console.log('MatchFinished — osvežavam utakmicu:', matchId);
        this.loadMatch(matchId);
      });
  }

  // ============================================================
  // UNIŠTAVANJE KOMPONENTE
  // ============================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Napuštamo samo grupu ove utakmice.
    // Ne gasimo globalnu konekciju koju mogu koristiti druge komponente.
    if (this.matchId > 0) {
      void this.liveMatchService
        .leaveMatch(this.matchId)
        .catch(error => {
          console.error('Greška pri napuštanju utakmice:', error);
        });
    }
  }

  // ============================================================
  // POMOĆNE METODE ZA HTML
  // ============================================================

  getStatusText(status: number | string): string {
    switch (status) {
      case 0:
      case 'Scheduled':
        return 'Zakazano';

      case 1:
      case 'Live':
        return 'Uživo';

      case 2:
      case 'Finished':
        return 'Završeno';

      case 3:
      case 'Postponed':
        return 'Odloženo';

      case 4:
      case 'Cancelled':
        return 'Otkazano';

      default:
        return 'Nepoznat status';
    }
  }

  isFinished(): boolean {
    return this.match?.status === 2 ||
           this.match?.status === 'Finished';
  }

  getTeamEvents(teamId: number | null | undefined): any[] {
    if (teamId == null || !Array.isArray(this.match?.events)) {
      return [];
    }

    return this.match.events.filter(
      (event: any) =>
        (event.teamId ?? event.relatedPlayerTeamId) === teamId
    );
  }

  getEventIcon(type: number): string {
    switch (type) {
      case 0: return '⚽';
      case 1: return '🟨';
      case 2: return '🟥';
      case 3: return '🎯';
      case 4: return '🔄';
      default: return '•';
    }
  }

  getEventText(type: number): string {
    switch (type) {
      case 0: return 'Gol';
      case 1: return 'Žuti karton';
      case 2: return 'Crveni karton';
      case 3: return 'Asistencija';
      case 4: return 'Izmena';
      default: return String(type);
    }
  }
}
