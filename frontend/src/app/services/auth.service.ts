import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = signal<boolean>(localStorage.getItem('is_logged_in') === 'true');

  constructor(private router: Router) {}

  login(email?: string, password?: string) {
    localStorage.setItem('is_logged_in', 'true');
    this.isLoggedIn.set(true);
    this.router.navigate(['/home']);
  }

  logout() {
    localStorage.removeItem('is_logged_in');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}
