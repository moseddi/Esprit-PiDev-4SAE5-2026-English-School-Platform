import { Injectable, OnDestroy } from '@angular/core';
import { Client, over } from 'stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { ChannelWsMessage } from '../models/channel.models';

@Injectable({ providedIn: 'root' })
export class ChannelWebSocketService implements OnDestroy {
  private stompClient!: Client;
  private socket!: any;
  private subscriptions = new Map<number, any>();
  private messageSubject = new Subject<ChannelWsMessage>();
  private globalNotifySubject = new Subject<any>();
  private connected = false;
  private pendingSubscriptions: number[] = [];

  message$ = this.messageSubject.asObservable();
  globalNotify$ = this.globalNotifySubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const baseUrl = window.location.origin;
      // Force ONLY standard websocket transport. No HTTP fallbacks.
      this.socket = new SockJS(`${baseUrl}/assessment-api/ws`, null, {
        transports: ['websocket']
      });
      this.stompClient = over(this.socket);
      this.stompClient.debug = () => {};

      this.stompClient.connect({}, () => {
        this.connected = true;
        
        // Subscribe to global notifications
        this.stompClient.subscribe('/topic/global-notifications', (sdkEvent) => {
          const data = JSON.parse(sdkEvent.body);
          this.globalNotifySubject.next(data);
        });

        this.pendingSubscriptions.forEach(id => this.doSubscribeToChannel(id));
        this.pendingSubscriptions = [];
      }, (error: any) => {
        this.connected = false;
        setTimeout(() => this.connect(), 5000);
      });
    } catch (e) {
      setTimeout(() => this.connect(), 5000);
    }
  }

  subscribeToChannel(channelId: number): void {
    if (this.subscriptions.has(channelId)) return;

    if (this.connected) {
      this.doSubscribeToChannel(channelId);
    } else {
      this.pendingSubscriptions.push(channelId);
    }
  }

  private doSubscribeToChannel(channelId: number): void {
    const sub = this.stompClient.subscribe(`/topic/channel/${channelId}`, (sdkEvent) => {
      const msg: ChannelWsMessage = JSON.parse(sdkEvent.body);
      this.messageSubject.next(msg);
    });
    this.subscriptions.set(channelId, sub);
  }

  unsubscribeFromChannel(channelId: number): void {
    const sub = this.subscriptions.get(channelId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(channelId);
    }
  }

  getChannelMessages(channelId: number): Observable<ChannelWsMessage> {
    this.subscribeToChannel(channelId);
    return new Observable(observer => {
      const subscription = this.message$.subscribe(msg => {
        if (msg.channelId === channelId) {
          observer.next(msg);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {});
    }
  }
}
