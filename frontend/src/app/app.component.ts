import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="phone-frame">
      <!-- High-End Splash Screen Loader -->
      @if (showSplash()) {
        <div class="app-splash-screen" [class.fade-out]="fadeSplash()">
          <div class="splash-glow"></div>
          <div class="splash-content">
            <!-- App Logo / Title -->
            <div class="splash-title-container">
              <h1 class="splash-title">Łowca</h1>
              <p class="splash-subtitle">Biedronka • Lidl • Kaufland</p>
            </div>
            
            <!-- Store Logos Container -->
            <div class="splash-logos-row">
              <div class="logo-wrapper biedronka">
                <svg viewBox="0 0 100 100" class="splash-logo">
                  <circle cx="50" cy="50" r="45" fill="#ffcc00"/>
                  <path d="M 50 15 A 35 35 0 0 1 85 50 A 35 35 0 0 1 50 85 A 35 35 0 0 1 15 50 A 35 35 0 0 1 50 15" fill="#e30613"/>
                  <line x1="50" y1="15" x2="50" y2="85" stroke="#000" stroke-width="2"/>
                  <circle cx="50" cy="22" r="12" fill="#1e293b"/>
                  <circle cx="46" cy="19" r="2.5" fill="#fff"/>
                  <circle cx="54" cy="19" r="2.5" fill="#fff"/>
                  <circle cx="46" cy="19" r="1" fill="#000"/>
                  <circle cx="54" cy="19" r="1" fill="#000"/>
                  <circle cx="33" cy="40" r="4" fill="#1e293b"/>
                  <circle cx="30" cy="55" r="5" fill="#1e293b"/>
                  <circle cx="38" cy="70" r="4" fill="#1e293b"/>
                  <circle cx="67" cy="40" r="4" fill="#1e293b"/>
                  <circle cx="70" cy="55" r="5" fill="#1e293b"/>
                  <circle cx="62" cy="70" r="4" fill="#1e293b"/>
                </svg>
              </div>
              <div class="logo-wrapper lidl">
                <svg viewBox="0 0 100 100" class="splash-logo">
                  <rect x="5" y="5" width="90" height="90" rx="18" fill="#0050aa" stroke="#fff" stroke-width="2.5"/>
                  <circle cx="50" cy="50" r="36" fill="#ffec00"/>
                  <text x="50" y="59" font-family="'Outfit', sans-serif" font-weight="900" font-size="26" fill="#e30613" text-anchor="middle" transform="rotate(-10 50 50)">LIDL</text>
                </svg>
              </div>
              <div class="logo-wrapper kaufland">
                <svg viewBox="0 0 100 100" class="splash-logo">
                  <rect x="5" y="5" width="90" height="90" rx="12" fill="none" stroke="#e30613" stroke-width="8"/>
                  <rect x="18" y="18" width="64" height="64" fill="#e30613"/>
                  <text x="50" y="65" font-family="'Outfit', sans-serif" font-weight="800" font-size="50" fill="#fff" text-anchor="middle">K</text>
                </svg>
              </div>
            </div>

            <!-- Progress / Loading -->
            <div class="splash-loader-container">
              <div class="splash-loader-bar"></div>
              <span class="splash-loader-text">Szukanie najlepszych okazji...</span>
            </div>
          </div>
        </div>
      }

      <!-- Top Action Bar -->
      <div class="status-bar">
        <div class="status-left">
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
    /* High-End Splash Screen Loader */
    .app-splash-screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #1e293b, #0f172a, #020617);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .app-splash-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .splash-glow {
      position: absolute;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
      filter: blur(40px);
      animation: pulse-glow 3s ease-in-out infinite alternate;
      pointer-events: none;
    }
    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
      width: 100%;
      max-width: 320px;
      text-align: center;
      z-index: 2;
    }
    .splash-title-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .splash-title {
      font-size: 48px;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #ffffff 30%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
      text-shadow: 0 4px 20px rgba(56, 189, 248, 0.2);
      animation: scale-up-title 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .splash-subtitle {
      font-size: 14px;
      font-weight: 500;
      color: #94a3b8;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0;
      animation: fade-in-up 0.8s ease forwards 0.3s;
    }
    .splash-logos-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin: 15px 0;
    }
    .logo-wrapper {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      padding: 1px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: translateY(20px) scale(0.8);
      transition: all 0.3s ease;
    }
    .logo-wrapper.biedronka {
      animation: pop-in-logo 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.5s;
    }
    .logo-wrapper.lidl {
      animation: pop-in-logo 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.7s;
    }
    .logo-wrapper.kaufland {
      animation: pop-in-logo 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.9s;
    }
    .splash-logo {
      width: 100%;
      height: 100%;
    }
    .splash-loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 80%;
      opacity: 0;
      animation: fade-in-up 0.8s ease forwards 1.1s;
    }
    .splash-loader-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }
    .splash-loader-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 45%;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      border-radius: 10px;
      animation: loading-slide 1.5s ease-in-out infinite;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
    }
    .splash-loader-text {
      font-size: 11px;
      font-weight: 500;
      color: #64748b;
    }

    @keyframes pulse-glow {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.15); opacity: 0.8; }
    }
    @keyframes scale-up-title {
      0% { transform: scale(0.85); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fade-in-up {
      0% { transform: translateY(10px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes pop-in-logo {
      0% { transform: translateY(20px) scale(0.8); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes loading-slide {
      0% { left: -45%; }
      50% { left: 100%; width: 55%; }
      100% { left: 100%; width: 45%; }
    }

    /* Original Layout Styles */
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

  showSplash = signal(true);
  fadeSplash = signal(false);

  constructor() {
    // Start splash screen fade out after 2.3 seconds
    setTimeout(() => {
      this.fadeSplash.set(true);
      // Remove element from DOM after fade transition completes
      setTimeout(() => {
        this.showSplash.set(false);
      }, 500);
    }, 2300);
  }
}
