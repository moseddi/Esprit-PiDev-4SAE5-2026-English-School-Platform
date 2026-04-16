import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClubRegistration, ClubRegistrationCreateRequest, ClubRegistrationUpdateRequest } from '../models';

import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClubRegistrationService {
  private apiUrl = '/api/club-registrations';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  }

  getRegistrations(): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(this.apiUrl, this.getHttpOptions());
  }

  getRegistrationById(id: number): Observable<ClubRegistration> {
    return this.http.get<ClubRegistration>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  getRegistrationsByClub(clubId: number): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(`${this.apiUrl}/club/${clubId}`, this.getHttpOptions());
  }

  getRegistrationsByUser(userId: number): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(`${this.apiUrl}/user/${userId}`, this.getHttpOptions());
  }

  createRegistration(registrationData: ClubRegistrationCreateRequest): Observable<ClubRegistration> {
    console.log('=== SENDING REGISTRATION TO API ===');
    console.log('Endpoint:', this.apiUrl);
    console.log('Data:', registrationData);
    return this.http.post<ClubRegistration>(this.apiUrl, registrationData, this.getHttpOptions());
  }

  updateRegistration(id: number, registrationData: ClubRegistrationUpdateRequest): Observable<ClubRegistration> {
    return this.http.put<ClubRegistration>(`${this.apiUrl}/${id}`, registrationData, this.getHttpOptions());
  }

  deleteRegistration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }
}
