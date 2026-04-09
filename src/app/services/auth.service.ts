import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/user-api/users'; // Updated to point to the integrated user API
  private tokenKey = 'auth_token';
  private userKey = 'current_user'; // Unified with assessment_project key

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Save using the format expected by the assessment project
        localStorage.setItem(this.userKey, JSON.stringify(response));
        // Also save a token if present for legacy team components
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  updateUserData(userData: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.userKey); // Check for unified user object
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }
}