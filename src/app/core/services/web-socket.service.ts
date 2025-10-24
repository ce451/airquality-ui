import {Injectable, NgZone} from '@angular/core';
import {Client, StompSubscription} from '@stomp/stompjs';
import {BehaviorSubject, filter, Observable, shareReplay, Subject} from 'rxjs';
import {Measurement} from 'src/app/core/models/measurement.model';
import {environment} from '@environments/environment.development';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client?: Client;
  private connected$ = new BehaviorSubject<boolean>(false);
  private measurements$ = new Subject<Measurement>();
  private topicSub?: StompSubscription;

  public readonly isConnected$ = this.connected$.asObservable().pipe(shareReplay(1));

  constructor(private zone: NgZone) {
    this.init();
  }

  private init() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 1000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        console.log(str);
      }
    });

    this.client.onConnect = () => {
      this.zone.run(() => {
        this.connected$.next(true);
      });

      this.subscribeToMeasurements();
    }

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Broker error:', frame.headers['message'], frame.body);
    }

    this.client.onWebSocketClose = () => {
      this.zone.run(() => {
        this.connected$.next(false);
      });
      console.warn('[STOMP] WebSocket connection closed');
    }

    this.client.activate();
  }

  private subscribeToMeasurements() {
    if (!this.client || this.topicSub)
      return;

    this.topicSub = this.client.subscribe('/topic/measurements', (message) => {
      try {
        const payload: Measurement = JSON.parse(message.body);
        this.zone.run(() => this.measurements$.next(payload));
      } catch (error) {
        console.error('[STOMP] Error parsing message:', error);
      }
    });
  }

  public streamAll(): Observable<Measurement> {
    return this.measurements$.asObservable();
  }

  public streamForStation(stationId: number): Observable<Measurement> {
    return this.measurements$.pipe(
      filter(m => m.stationId === stationId)
    );
  }

  public disconnect() {
    try {
      this.topicSub?.unsubscribe();
      this.topicSub = undefined;
      this.client?.deactivate();
    } catch (e) {}
  }
}
