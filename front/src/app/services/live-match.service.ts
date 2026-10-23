
import { Injectable } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MatchUpdatedEvent {
  matchId: number;
  homeScore: number;
  awayScore: number;
  status: string;
  isLive: boolean;
  updatedAt: string;
}

export interface MatchStartedEvent {
  matchId: number;
  startedAt: string;
}

export interface MatchFinishedEvent {
  matchId: number;
  homeScore: number;
  awayScore: number;
  finishedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiveMatchService {
  private hubConnection: HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;

  // Utakmice koje ovaj tab trenutno prati.
  private joinedMatches = new Set<number>();

  private readonly matchUpdatedSubject =
    new Subject<MatchUpdatedEvent>();

  private readonly matchStartedSubject =
    new Subject<MatchStartedEvent>();

  private readonly matchFinishedSubject =
    new Subject<MatchFinishedEvent>();

  public readonly matchUpdated$ =
    this.matchUpdatedSubject.asObservable();

  public readonly matchStarted$ =
    this.matchStartedSubject.asObservable();

  public readonly matchFinished$ =
    this.matchFinishedSubject.asObservable();

  // ============================================================
  // POVEZIVANJE
  // ============================================================

  async connect(): Promise<void> {
    const current = this.hubConnection;

    if (current?.state === HubConnectionState.Connected) {
      return;
    }

    // Ako se povezivanje već izvršava, sačekaj isti pokušaj.
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Tokom reconnect-a ne pokrećemo novu konekciju.
    if (
      current &&
      current.state !== HubConnectionState.Disconnected
    ) {
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/hubs/live-match`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection = connection;

    this.registerEvents(connection);

    connection.onreconnecting(error => {
      console.warn('SignalR: veza je prekinuta, pokušavam ponovo.', error);
    });

    connection.onreconnected(async connectionId => {
      console.log('SignalR ponovo povezan:', connectionId);

      // Nakon reconnect-a prethodne grupe više nisu garantovano aktivne.
      for (const matchId of this.joinedMatches) {
        try {
          await connection.invoke('JoinMatch', matchId);
          console.log(`Ponovo pridružen utakmici ${matchId}`);
        } catch (error) {
          console.error(
            `Ponovno pridruživanje utakmici ${matchId} nije uspelo:`,
            error
          );
        }
      }

      // SignalR ne vraća poruke propuštene tokom prekida.
      // Obavesti komponente da ponovo učitaju stanje sa API-ja.
      this.notifyMatchesNeedRefresh();
    });

    connection.onclose(error => {
      console.error('SignalR konekcija je zatvorena:', error);
    });

    this.connectionPromise = connection.start()
      .then(() => {
        console.log('SignalR povezan.');
      })
      .catch(error => {
        if (this.hubConnection === connection) {
          this.hubConnection = null;
        }

        console.error('SignalR povezivanje nije uspelo:', error);
        throw error;
      })
      .finally(() => {
        this.connectionPromise = null;
      });

    return this.connectionPromise;
  }

  // ============================================================
  // SIGNALR DOGAĐAJI
  // ============================================================

  private registerEvents(connection: HubConnection): void {
    connection.on(
      'MatchUpdated',
      (data: MatchUpdatedEvent) => {
        console.log('MatchUpdated:', data);
        this.matchUpdatedSubject.next(data);
      }
    );

    connection.on(
      'MatchStarted',
      (data: MatchStartedEvent) => {
        console.log('MatchStarted:', data);
        this.matchStartedSubject.next(data);
      }
    );

    connection.on(
      'MatchFinished',
      (data: MatchFinishedEvent) => {
        console.log('MatchFinished:', data);
        this.matchFinishedSubject.next(data);
      }
    );
  }

  // ============================================================
  // PRIDRUŽIVANJE UTAKMICI
  // ============================================================

  async joinMatch(matchId: number): Promise<void> {
    this.joinedMatches.add(matchId);

    await this.connect();

    const connection = this.hubConnection;

    if (!connection) {
      throw new Error('SignalR konekcija nije dostupna.');
    }

    // Ako se konekcija trenutno ponovo uspostavlja,
    // onreconnected će pridružiti sve utakmice iz joinedMatches.
    if (connection.state !== HubConnectionState.Connected) {
      console.warn(
        `Čekam reconnect pre pridruživanja utakmici ${matchId}.`
      );
      return;
    }

    await connection.invoke('JoinMatch', matchId);

    console.log(`Pridružen utakmici ${matchId}`);
  }

  // ============================================================
  // NAPUŠTANJE UTAKMICE
  // ============================================================

  async leaveMatch(matchId: number): Promise<void> {
    this.joinedMatches.delete(matchId);

    const connection = this.hubConnection;

    if (
      !connection ||
      connection.state !== HubConnectionState.Connected
    ) {
      return;
    }

    await connection.invoke('LeaveMatch', matchId);

    console.log(`Napustio utakmicu ${matchId}`);
  }

  // ============================================================
  // OBAVEŠTAVANJE KOMPONENTI NAKON RECONNECT-A
  // ============================================================

  private notifyMatchesNeedRefresh(): void {
    for (const matchId of this.joinedMatches) {
      this.matchUpdatedSubject.next({
        matchId,
        homeScore: 0,
        awayScore: 0,
        status: '',
        isLive: false,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // ============================================================
  // RUČNO GAŠENJE KONEKCIJE
  // ============================================================

  async disconnect(): Promise<void> {
    const connection = this.hubConnection;

    this.hubConnection = null;
    this.joinedMatches.clear();

    if (connection) {
      await connection.stop();
    }

    console.log('SignalR prekinut.');
  }
}
