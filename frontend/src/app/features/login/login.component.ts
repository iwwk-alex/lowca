import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="brand-header">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <h1>{{ ts.t('login.title') }}</h1>
        <p class="subtitle">{{ ts.t('login.subtitle') }}</p>
      </div>

      <div class="glass-card login-form-card">
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">{{ ts.t('login.email') }}</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              placeholder="user@example.com" 
              required
            />
          </div>

          <div class="form-group">
            <label for="password">{{ ts.t('login.password') }}</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button type="submit" class="submit-btn">
            {{ ts.t('login.button') }}
          </button>
        </form>

        <div class="divider">
          <span>{{ ts.currentLang() === 'pl' ? 'lub' : 'или' }}</span>
        </div>

        <button type="button" class="guest-btn" (click)="loginAsGuest()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {{ ts.t('login.guest') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 24px;
    }
    .brand-header {
      text-align: center;
      margin-bottom: 32px;
      animation: fadeInDown 0.6s ease-out;
    }
    .logo-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-color) 0%, #3b82f6 100%);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
      color: #fff;
      margin-bottom: 16px;
    }
    .logo-circle svg {
      width: 32px;
      height: 32px;
    }
    .brand-header h1 {
      font-size: 26px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      max-width: 260px;
      margin: 0 auto;
    }
    .login-form-card {
      margin-bottom: 0;
      padding: 24px;
      background: rgba(30, 41, 59, 0.5);
      border-color: rgba(255,255,255,0.08);
      animation: fadeInUp 0.6s ease-out 0.1s both;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 18px;
    }
    .form-group label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-group input {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 14px;
      color: #fff;
      font-size: 14px;
      transition: all 0.3s ease;
      outline: none;
    }
    .form-group input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
      background: rgba(15, 23, 42, 0.7);
    }
    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--accent-color) 0%, #1d4ed8 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
      margin-top: 8px;
    }
    .submit-btn:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 20px 0;
      color: rgba(255,255,255,0.2);
      font-size: 12px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .divider:not(:empty)::before {
      margin-right: .5em;
    }
    .divider:not(:empty)::after {
      margin-left: .5em;
    }
    .guest-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      border-radius: 12px;
      padding: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .guest-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.2);
    }
    .guest-btn:active {
      transform: scale(0.98);
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private authService = inject(AuthService);
  public ts = inject(TranslationService);

  email = '';
  password = '';

  onSubmit() {
    // Basic local validation
    if (this.email.trim() && this.password.trim()) {
      this.authService.login(this.email, this.password);
    }
  }

  loginAsGuest() {
    this.authService.login();
  }
}
