import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AppUser {
    id: number;
    username: string;
    email: string;
    password?: string;
    role: 'ADMIN' | 'PLAYER' | 'TUTOR';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly baseUrl = '/user-api/users';
    private readonly STORAGE_KEY = 'current_user';

    constructor(private http: HttpClient) { }

    register(user: { username: string; email: string; password: string; role: 'ADMIN' | 'PLAYER' | 'TUTOR' }): Observable<AppUser> {
        return this.http.post<AppUser>(`${this.baseUrl}/register`, user).pipe(
            tap(u => this.saveUser(u))
        );
    }

    login(email: string, password: string): Observable<AppUser> {
        return this.http.post<AppUser>(`${this.baseUrl}/login`, { email, password }).pipe(
            tap(u => this.saveUser(u))
        );
    }

    logout(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('auth_token');
    }

    getCurrentUser(): AppUser | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }

    isAdmin(): boolean {
        return this.getCurrentUser()?.role === 'ADMIN';
    }

    isPlayer(): boolean {
        return this.getCurrentUser()?.role === 'PLAYER';
    }

    private saveUser(user: AppUser): void {
        const { password, ...safeUser } = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
    }
}
