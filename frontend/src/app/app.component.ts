import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="phone-frame">
      <!-- Phone Mock Status Bar -->
      <div class="status-bar">
        <div class="status-left">
          <span class="time">15:14</span>
          <button class="lang-toggle-btn" (click)="ts.toggleLanguage()">
            {{ ts.currentLang().toUpperCase() }}
          </button>
          @if (auth.isLoggedIn()) {
            <button class="logout-btn" (click)="auth.logout()" [title]="ts.t('login.logout')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          }
        </div>
        <div class="icons">
          <!-- Signal Icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 22h20V2z"/>
          </svg>
          <!-- Battery Icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m2 3h2v8h-2z"/>
          </svg>
        </div>
      </div>

      <!-- Main Display -->
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Nav Bar -->
      @if (auth.isLoggedIn()) {
        <nav class="bottom-nav">
          <a class="nav-item" routerLink="/home" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>{{ ts.t('nav.home') }}</span>
          </a>
          <a class="nav-item" routerLink="/leaflets" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>{{ ts.t('nav.leaflets') }}</span>
          </a>
          <a class="nav-item" routerLink="/comparison" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{{ ts.t('nav.compare') }}</span>
          </a>
          <a class="nav-item" routerLink="/shopping-list" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>{{ ts.t('nav.list') }}</span>
          </a>
          <a class="nav-item" routerLink="/cards" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>{{ ts.t('nav.cards') }}</span>
          </a>
        </nav>
      }
    </div>
  `,
  styles: [`
    .logout-btn {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      padding: 4px 6px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      margin-left: 10px;
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.4);
    }
    .logout-btn svg {
      width: 12px;
      height: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  public ts = inject(TranslationService);
  public auth = inject(AuthService);
}
