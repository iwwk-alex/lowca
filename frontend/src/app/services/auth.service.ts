import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { API_CONFIG } from '../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = signal<boolean>(!!localStorage.getItem('auth_token'));
  currentUser = signal<any>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): any {
    try {
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${API_CONFIG.baseUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(email: string, password: string, name?: string) {
    return this.http.post<any>(`${API_CONFIG.baseUrl}/auth/register`, { email, password, name }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  private saveSession(res: any) {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    this.isLoggedIn.set(true);
    this.currentUser.set(res.user);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('is_logged_in');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserId(): string | null {
    return this.currentUser()?.id || null;
  }
}

