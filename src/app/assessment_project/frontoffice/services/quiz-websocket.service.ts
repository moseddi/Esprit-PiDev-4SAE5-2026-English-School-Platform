import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Client, over } from 'stompjs';
import SockJS from 'sockjs-client';

export interface QuizEvent {
    type: 'PLAYER_JOINED' | 'START' | 'QUESTION' | 'SCORE_UPDATE' | 'RANKING_UPDATE' | 'END';
    payload: any;
}

@Injectable({ providedIn: 'root' })
export class QuizWebsocketService {
    private socket: WebSocket | any = null;
    private stompClient: Client | null = null;
    private eventSubject = new Subject<QuizEvent>();

    constructor(private zone: NgZone) { }

    // ✅ Connect using SockJS/STOMP (More robust for Spring Boot)
    connect(sessionId: string): void {
        try {
            // 1. Try SockJS + STOMP first (Modern Spring way)
            console.log(`[QuizWS] Tentative de connexion STOMP pour session ${sessionId}...`);
            const socket = new SockJS(`http://${window.location.host}/ws-quiz`);
            this.stompClient = over(socket);
            this.stompClient.debug = () => { }; // Silence logs

            this.stompClient.connect({}, (frame) => {
                console.log('[QuizWS] STOMP Connecté !');
                this.stompClient?.subscribe(`/topic/quiz/${sessionId}`, (message) => {
                    this.handleMessage(message.body);
                });
            }, (error) => {
                console.warn('[QuizWS] STOMP Échoué, tentative WebSocket brut...', error);
                this.connectRaw(sessionId);
            });
        } catch (e) {
            this.connectRaw(sessionId);
        }
    }

    private connectRaw(sessionId: string): void {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;

        this.socket = new WebSocket(`${protocol}//${host}/ws-quiz?session=${sessionId}`);

        this.socket.onopen = () => console.log('[QuizWS] WebSocket brut connecté');
        this.socket.onmessage = (event: any) => this.handleMessage(event.data);
        this.socket.onerror = (error: any) => {
            console.error('[QuizWS] Erreur WebSocket brut:', error);
            this.simulateEvents();
        };
        this.socket.onclose = () => console.log('[QuizWS] Déconnecté');
    }

    private handleMessage(data: string): void {
        try {
            const parsed = JSON.parse(data);
            // Run inside Angular zone so change detection fires on every WS event
            this.zone.run(() => this.eventSubject.next(parsed));
        } catch (e) {
            console.warn('[QuizWS] Message non-JSON:', data);
        }
    }

    getEvents(): Observable<QuizEvent> {
        return this.eventSubject.asObservable();
    }

    sendAnswer(payload: any): void {
        if (this.stompClient?.connected) {
            this.stompClient.send('/app/quiz/answer', {}, JSON.stringify(payload));
        } else if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'SUBMIT_ANSWER', payload }));
        }
    }

    private simulateEvents(): void {
        console.log('[QuizWS] Mode Simulation activé (Backend WS indisponible)');
        // Simulation d'un événement START pour ne pas rester bloqué si on a des questions
        setTimeout(() => {
            console.log('[QuizWS] Simulation: Envoi EVENT START...');
            this.eventSubject.next({ type: 'START', payload: {} });
        }, 2000);
    }
}
