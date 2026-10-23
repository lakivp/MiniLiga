import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LiveMatchUpdate {
  matchId: number;
  homeScore: number;
  awayScore: number;
  status: string;
  isLive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PublicLiveMatchService {
  private readonly hubConnection: signalR.HubConnection;

  private readonly matchUpdatedSubject =
    new Subject<LiveMatchUpdate>();

  private readonly reconnectedSubject =
    new Subject<void>();

  readonly matchUpdated$ =
    this.matchUpdatedSubject.asObservable();

  // Emisija nakon reconnect-a i ponovnog pridruživanja grupama.
  readonly reconnected$ =
    this.reconnectedSubject.asObservable();

  private readonly joinedMatchIds = new Set<number>();

  private startPromise: Promise<void> | null = null;

  constructor() {
    this.hubConnection =
      new signalR.HubConnectionBuilder()
        .withUrl(`${environment.hubUrl}/hubs/live-match`)
        .withAutomaticReconnect()
        .build();

    this.registerEvents();

    this.hubConnection.onreconnecting(error => {
      console.warn(
        'SignalR veza se ponovo uspostavlja:',
        error
      );
    });

    this.hubConnection.onreconnected(async () => {
      console.log(
        'SignalR veza je ponovo uspostavljena.'
      );

      let allGroupsJoined = true;

      for (const matchId of this.joinedMatchIds) {
        try {
          await this.hubConnection.invoke(
            'JoinMatch',
            matchId
          );
        } catch (error) {
          allGroupsJoined = false;

          console.error(
            `Greška pri ponovnom pridruživanju utakmici ${matchId}:`,
            error
          );
        }
      }

      // Rezultate osvežavamo tek nakon pokušaja
      // ponovnog pridruživanja grupama.
      if (allGroupsJoined) {
        this.reconnectedSubject.next();
      }
    });

    this.hubConnection.onclose(error => {
      if (error) {
        console.error(
          'SignalR konekcija je zatvorena:',
          error
        );
      }
    });
  }

  // =========================================================
  // PRIJEM SIGNALR DOGAĐAJA
  // =========================================================

  private registerEvents(): void {
    this.hubConnection.on(
      'MatchUpdated',
      (update: LiveMatchUpdate) => {
        this.matchUpdatedSubject.next(update);
      }
    );
  }

  // =========================================================
  // POVEZIVANJE
  // =========================================================

  async start(): Promise<void> {
    if (
      this.hubConnection.state ===
      signalR.HubConnectionState.Connected
    ) {
      return;
    }

    // Ako je povezivanje već u toku, čekamo isti pokušaj.
    if (this.startPromise) {
      return this.startPromise;
    }

    // Automatsko ponovno povezivanje već je u toku.
    if (
      this.hubConnection.state !==
      signalR.HubConnectionState.Disconnected
    ) {
      return;
    }

    this.startPromise = this.hubConnection
      .start()
      .then(() => {
        console.log(
          'Javna SignalR konekcija je uspostavljena.'
        );
      })
      .catch(error => {
        console.error(
          'Pokretanje SignalR konekcije nije uspelo:',
          error
        );

        throw error;
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  // =========================================================
  // PRIDRUŽIVANJE UTAKMICI
  // =========================================================

  async joinMatch(matchId: number): Promise<void> {
    await this.start();

    if (this.joinedMatchIds.has(matchId)) {
      return;
    }

    if (
      this.hubConnection.state !==
      signalR.HubConnectionState.Connected
    ) {
      throw new Error(
        `SignalR nije povezan. Utakmica ${matchId} nije pridružena.`
      );
    }

    await this.hubConnection.invoke(
      'JoinMatch',
      matchId
    );

    // Čuvamo ID tek nakon uspešnog pridruživanja.
    this.joinedMatchIds.add(matchId);

  }

  // =========================================================
  // NAPUŠTANJE UTAKMICE
  // =========================================================

  async leaveMatch(matchId: number): Promise<void> {
    if (!this.joinedMatchIds.has(matchId)) {
      return;
    }

    if (
      this.hubConnection.state ===
      signalR.HubConnectionState.Connected
    ) {
      await this.hubConnection.invoke(
        'LeaveMatch',
        matchId
      );
    }

    // Ako veza nije aktivna, server će ukloniti konekciju
    // iz grupa prilikom prekida veze.
    this.joinedMatchIds.delete(matchId);
  }

  // =========================================================
  // NAPUŠTANJE SVIH UTAKMICA
  // =========================================================

  async leaveAllMatches(): Promise<void> {
    const matchIds = [...this.joinedMatchIds];

    for (const matchId of matchIds) {
      try {
        await this.leaveMatch(matchId);
      } catch (error) {
        console.error(
          `Greška pri napuštanju utakmice ${matchId}:`,
          error
        );
      }
    }
  }

  // =========================================================
  // PREKID KONEKCIJE
  // =========================================================

  async stop(): Promise<void> {
    this.joinedMatchIds.clear();

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // Ako povezivanje nije uspelo, nema aktivne veze za gašenje.
      }
    }

    if (
      this.hubConnection.state !==
      signalR.HubConnectionState.Disconnected
    ) {
      await this.hubConnection.stop();
    }
  }
}