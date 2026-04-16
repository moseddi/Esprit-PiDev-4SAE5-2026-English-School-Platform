import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Event, EventCreateRequest, EventUpdateRequest, EventCreateRequestBackend, EventUpdateRequestBackend } from '../models/event.model';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = '/api/events';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl, this.getHttpOptions());
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  createEvent(eventData: EventCreateRequest): Observable<Event> {
    const formatDate = (d: string) => d && d.length === 16 ? d + ':00' : d;
    const backendData: EventCreateRequestBackend = {
      Title: eventData.Title,
      Type: eventData.type,
      StartDate: formatDate(eventData.startDate),
      EndDate: formatDate(eventData.endDate),
      Manifesto: eventData.manifesto,
      MaxParticipants: Number(eventData.maxParticipants),
      Status: eventData.status || 'PLANNED',
      ID_Club: Number(eventData.ID_Club),
      EstimatedCost: Number(eventData.estimatedCost)
    };
    return this.http.post<Event>(this.apiUrl, backendData, this.getHttpOptions());
  }

  updateEvent(id: number, eventData: EventUpdateRequest): Observable<Event> {
    const formatDate = (d: string | undefined) => d && d.length === 16 ? d + ':00' : d;
    const sanitized: EventUpdateRequestBackend = {
      Title: eventData.Title,
      Type: eventData.type,
      StartDate: formatDate(eventData.startDate),
      EndDate: formatDate(eventData.endDate),
      Manifesto: eventData.manifesto,
      MaxParticipants: eventData.maxParticipants !== undefined ? Number(eventData.maxParticipants) : undefined,
      Status: eventData.status,
      ID_Club: eventData.ID_Club !== undefined ? Number(eventData.ID_Club) : undefined,
      EstimatedCost: eventData.estimatedCost !== undefined ? Number(eventData.estimatedCost) : undefined
    };
    return this.http.put<Event>(`${this.apiUrl}/${id}`, sanitized, this.getHttpOptions());
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  registerForEvent(eventId: number, data: { userName: string, userEmail: string, userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register`, data, this.getHttpOptions());
  }

  getRegistrationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/registrations/${id}`, this.getHttpOptions());
  }

  isUserRegistered(eventId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${eventId}/is-registered`, {
      ...this.getHttpOptions(),
      params: { userId: userId.toString() }
    });
  }

  getUserRegistrations(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-registrations`, {
      ...this.getHttpOptions(),
      params: { userId: userId.toString() }
    });
  }

  getEventStats(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${eventId}/stats`, this.getHttpOptions());
  }

  getWaitlist(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${eventId}/waitlist`, this.getHttpOptions());
  }

  promoteFromWaitlist(regId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrations/${regId}/promote`, {}, this.getHttpOptions());
  }
}
