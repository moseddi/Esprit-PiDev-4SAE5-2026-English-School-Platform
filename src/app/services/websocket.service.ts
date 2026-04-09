import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';

export interface BudgetStats {
  totalEstimatedCost: number;
  activeEventsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client;
  public budgetStats$ = new BehaviorSubject<BudgetStats>({ totalEstimatedCost: 0, activeEventsCount: 0 });

  constructor(private ngZone: NgZone) {
    this.stompClient = new Client({
      // We drop SockJS and use a native WebSocket connection for maximum reliability in Angular
      brokerURL: 'ws://localhost:7072/ws-event-dashboard/websocket',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame: any) => {
        console.log('Connecté au WebSocket NATIF !', frame);

        fetch('http://localhost:7072/api/events/budget-stats')
          .then(res => res.json())
          .then(stats => {
            this.ngZone.run(() => this.budgetStats$.next(stats));
          })
          .catch(err => console.error('Init fetch error', err));

        this.stompClient.subscribe('/topic/budget-stats', (message: any) => {
          if (message.body) {
            const stats: BudgetStats = JSON.parse(message.body);
            console.log('Message WebSocket reçu :', stats);
            // Must run inside Angular Zone to trigger UI refresh automatically!
            this.ngZone.run(() => {
              this.budgetStats$.next(stats);
            });
          }
        });
      },
      onStompError: (frame: any) => {
        console.error('Erreur STOMP : ', frame);
      },
      onWebSocketError: (error: any) => {
        console.error('Erreur WebSocket !', error);
      }
    });

    this.connect();
  }

  private connect() {
    this.stompClient.activate();
  }
}
