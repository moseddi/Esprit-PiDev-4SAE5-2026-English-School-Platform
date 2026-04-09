import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { EventStats } from '../models/event-stats.model';

@Injectable({
    providedIn: 'root'
})
export class EventStatsService {
    private apiUrl = '/api/events';
    private stompClient: Client | null = null;
    private statsSubject = new BehaviorSubject<EventStats | null>(null);
    public stats$ = this.statsSubject.asObservable();

    constructor(private http: HttpClient) { }

    getStats(eventId: number): Observable<EventStats> {
        return this.http.get<EventStats>(`${this.apiUrl}/${eventId}/stats`);
    }

    getGlobalStats(): Observable<EventStats> {
        return this.http.get<EventStats>(`${this.apiUrl}/stats/global`);
    }

    connectToStats(eventId: number | 'global') {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }

        const socket = new SockJS('/ws-event-dashboard');
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (msg) => console.log(msg),
            onConnect: () => {
                console.log(`Connected to Event Stats WebSocket (${eventId})`);
                const topic = eventId === 'global' ? '/topic/event-stats/global' : `/topic/event-stats/${eventId}`;
                this.stompClient?.subscribe(topic, (message: Message) => {
                    if (message.body) {
                        this.statsSubject.next(JSON.parse(message.body));
                    }
                });
            }
        });

        this.stompClient.activate();
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
    }
}
