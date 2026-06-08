import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DocumentScanner, ResponseType } from '@capgo/capacitor-document-scanner';
import { Capacitor } from '@capacitor/core';
import { TranslationService } from '../../services/translation.service';
import { API_CONFIG } from '../../core/config/api.config';

interface ListProduct {
  id: string;
  name: string;
  store: 'biedronka' | 'lidl' | 'kaufland';
  price: number;
}

interface ScannedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalPrice: number;
}

interface PantryItem {
  id: string;
  name: string;
  purchaseDate: string; // ISO string
  durationPreset: 'day' | 'week' | 'month' | 'year';
  daysLeft?: number;
  percentLeft?: number;
  isLow?: boolean;
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-header list-header-row">
      <h1>{{ ts.t('list.title') }}</h1>
      <button class="scan-btn" (click)="openScanner()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        {{ ts.t('list.scan') }}
      </button>
    </header>

    <!-- Tab Switcher -->
    <div class="tab-switcher">
      <button class="tab-btn" [class.active]="activeTab() === 'list'" (click)="setTab('list')">
        {{ ts.t('list.title') }}
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'pantry'" (click)="setTab('pantry')">
        {{ ts.t('pantry.title') }}
      </button>
    </div>

    <!-- Active Shopping List Tab -->
    @if (activeTab() === 'list') {
      @if (listItems().length > 0) {
        <!-- Shopping List Items -->
        <div class="list-container">
          @for (item of listItems(); track item.id) {
            <div class="glass-card list-item">
              <div class="item-info">
                <span class="store-badge" [class]="'badge-' + item.store">{{ item.store }}</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-right">
                <span class="item-price">{{ item.price | number:'1.2-2' }} zł</span>
                <button class="delete-btn" (click)="removeItem(item.id)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Cost Summary Comparison -->
        <section class="summary-section">
          <h2>{{ ts.t('list.compare') }}</h2>
          
          <div class="summary-cards">
            <!-- Biedronka -->
            <div class="glass-card summary-card" [class.cheapest]="cheapestStore() === 'biedronka'">
              <div class="store-info">
                <span class="store-badge badge-biedronka">Biedronka</span>
                @if (cheapestStore() === 'biedronka') {
                  <span class="winner-badge">{{ ts.t('list.cheapest') }}</span>
                }
              </div>
              <div class="total-price">{{ totalBiedronka() | number:'1.2-2' }} zł</div>
            </div>

            <!-- Lidl -->
            <div class="glass-card summary-card" [class.cheapest]="cheapestStore() === 'lidl'">
              <div class="store-info">
                <span class="store-badge badge-lidl">Lidl</span>
                @if (cheapestStore() === 'lidl') {
                  <span class="winner-badge">{{ ts.t('list.cheapest') }}</span>
                }
              </div>
              <div class="total-price">{{ totalLidl() | number:'1.2-2' }} zł</div>
            </div>

            <!-- Kaufland -->
            <div class="glass-card summary-card" [class.cheapest]="cheapestStore() === 'kaufland'">
              <div class="store-info">
                <span class="store-badge badge-kaufland">Kaufland</span>
                @if (cheapestStore() === 'kaufland') {
                  <span class="winner-badge">{{ ts.t('list.cheapest') }}</span>
                }
              </div>
              <div class="total-price">{{ totalKaufland() | number:'1.2-2' }} zł</div>
            </div>
          </div>

          <!-- Split Smart Strategy -->
          <div class="glass-card split-strategy-card">
            <div class="strategy-header">
              <h3>{{ ts.t('list.smart_split') }}</h3>
              <span class="savings">{{ ts.t('list.save', { amount: (totalSavings() | number:'1.2-2') }) }}</span>
            </div>
            <p class="strategy-desc">
              {{ ts.t('list.smart_desc') }}
            </p>
            <div class="strategy-split-total">
              {{ ts.t('list.split_total') }}<span class="highlight">{{ totalSplit() | number:'1.2-2' }} zł</span>
            </div>
          </div>
        </section>

        <!-- Clear List Button -->
        <button class="clear-btn" (click)="clearList()">{{ ts.t('list.clear') }}</button>
      } @else {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <p>{{ ts.t('list.empty_title') }}</p>
          <p class="sub-text">{{ ts.t('list.empty_sub') }}</p>
          
          <button class="scan-first-btn" (click)="openScanner()">
            {{ ts.t('list.scan_first') }}
          </button>
        </div>
      }
    }

    <!-- Pantry Tracker Tab -->
    @if (activeTab() === 'pantry') {
      <div class="pantry-container">
        @if (processedPantryItems().length > 0) {
          <!-- Pantry Header with Clear All Button -->
          <div class="header-with-btn" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 16px; margin: 0; background: none; -webkit-text-fill-color: initial; color: #fff;">{{ ts.t('pantry.title') }}</h2>
            <button class="clear-btn" (click)="clearPantry()" style="margin: 0; padding: 6px 12px; font-size: 12px; border-radius: 8px;">
              {{ ts.currentLang() === 'pl' ? 'Wyczyść spiżarnię' : 'Очистить всё' }}
            </button>
          </div>

          <!-- Running out banner if any item is low -->
          @if (lowItemsCount() > 0) {
            <div class="glass-card low-warning-banner">
              <span class="warning-icon">⚠️</span>
              <span class="warning-text">
                {{ ts.currentLang() === 'pl' ? 'Masz ' + lowItemsCount() + ' produktów, które się kończą!' : 'Заканчиваются продукты (' + lowItemsCount() + ' шт.)!' }}
              </span>
            </div>
          }

          <div class="pantry-list">
            @for (item of processedPantryItems(); track item.id) {
              <div class="glass-card pantry-item" [class.pantry-low]="item.isLow">
                <div class="pantry-item-header">
                  <div class="pantry-title-group">
                    <span class="pantry-name">{{ item.name }}</span>
                    <span class="pantry-date">
                      {{ ts.currentLang() === 'pl' ? 'Kupiono: ' : 'Куплено: ' }}{{ formatDate(item.purchaseDate) }}
                    </span>
                  </div>
                  <div class="pantry-header-right" style="display: flex; align-items: center; gap: 8px;">
                    @if (item.isLow) {
                      <span class="low-badge pulse">{{ ts.t('pantry.running_out') }}</span>
                    }
                    <button class="delete-pantry-btn" (click)="removePantryItem(item.id)" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(239, 68, 68, 0.25);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="pantry-progress-section">
                  <div class="progress-bar-wrap">
                    <div 
                      class="progress-bar-fill" 
                      [style.width.%]="item.percentLeft"
                      [class.bg-red]="(item.percentLeft || 0) < 30"
                      [class.bg-orange]="(item.percentLeft || 0) >= 30 && (item.percentLeft || 0) < 60"
                      [class.bg-green]="(item.percentLeft || 0) >= 60">
                    </div>
                  </div>
                  <div class="progress-stats">
                    <span>{{ item.percentLeft }}%</span>
                    <span>{{ item.daysLeft }} {{ ts.currentLang() === 'pl' ? 'dni' : 'дн.' }}</span>
                  </div>
                </div>

                <!-- Preset Switcher -->
                <div class="pantry-footer">
                  <div class="preset-group">
                    <label>{{ ts.t('pantry.preset') }}:</label>
                    <div class="preset-chips">
                      <button 
                        class="chip-btn" 
                        [class.active]="item.durationPreset === 'day'"
                        (click)="changePreset(item.id, 'day')">
                        {{ ts.t('pantry.preset_day') }}
                      </button>
                      <button 
                        class="chip-btn" 
                        [class.active]="item.durationPreset === 'week'"
                        (click)="changePreset(item.id, 'week')">
                        {{ ts.t('pantry.preset_week') }}
                      </button>
                      <button 
                        class="chip-btn" 
                        [class.active]="item.durationPreset === 'month'"
                        (click)="changePreset(item.id, 'month')">
                        {{ ts.t('pantry.preset_month') }}
                      </button>
                      <button 
                        class="chip-btn" 
                        [class.active]="item.durationPreset === 'year'"
                        (click)="changePreset(item.id, 'year')">
                        {{ ts.t('pantry.preset_year') }}
                      </button>
                    </div>
                  </div>

                  @if (item.isLow) {
                    <button class="re-buy-btn" (click)="reBuyItem(item)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      {{ ts.t('pantry.add_back') }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <p>{{ ts.currentLang() === 'pl' ? 'Twoja spiżarnia jest pusta' : 'Ваша кладовая пуста' }}</p>
            <p class="sub-text">
              {{ ts.currentLang() === 'pl' ? 'Zeskanuj paragon ze sklepu, aby automatycznie dodać produkty do śledzenia zapasów.' : 'Отсканируйте чек из магазина, чтобы автоматически добавить продукты для контроля запасов.' }}
            </p>
          </div>
        }
      </div>
    }

    <!-- RECEIPT SCANNER MODAL BACKDROP -->
    @if (scannerOpen()) {
      <div class="scanner-backdrop" (click)="closeScanner()">
        <div class="scanner-modal" (click)="$event.stopPropagation()">
          
          <!-- STEP 1: Simulated Camera Viewfinder -->
          @if (scannerStep() === 'camera') {
            <div class="viewfinder-container">
              <div class="scanner-header">
                <h3>{{ ts.t('scanner.title') }}</h3>
                <p>{{ ts.t('scanner.guideline') }}</p>
              </div>
              
              <div class="camera-mock">
                <!-- Glowing laser scanner line -->
                <div class="scanner-laser"></div>
                
                <!-- Overlay text mimicking camera screen -->
                <div class="camera-guideline">{{ ts.t('scanner.align') }}</div>
              </div>
              
              <button class="capture-btn" (click)="retakePhoto()">
                {{ ts.t('scanner.photo') }}
              </button>
            </div>
          }

          <!-- STEP 1.5: Photo Preview before upload -->
          @if (scannerStep() === 'preview') {
            <div class="preview-container" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
              <div class="scanner-header" style="text-align: center;">
                <h3 style="color: #fff; margin: 0; font-size: 16px;">{{ ts.currentLang() === 'pl' ? 'Podgląd zdjęcia' : 'Проверка снимка' }}</h3>
                <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 12px;">
                  {{ ts.currentLang() === 'pl' ? 'Upewnij się, że tekst jest ostry i czytelny' : 'Убедитесь, что текст четкий и читаемый' }}
                </p>
              </div>
              
              <div class="image-preview-wrap" style="width: 100%; height: 320px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #0f172a; display: flex; align-items: center; justify-content: center;">
                @if (capturedImageUrl()) {
                  <img [src]="capturedImageUrl()" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                } @else {
                  <div style="color: var(--text-secondary); font-size: 13px;">{{ ts.currentLang() === 'pl' ? 'Demo zdjęcie чека' : 'Демо-режим снимка' }}</div>
                }
              </div>
              
              <div class="preview-actions" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <button class="accept-btn" (click)="uploadAndParse()">
                  {{ ts.currentLang() === 'pl' ? 'Wyślij do przetworzenia' : 'Распознать чек' }}
                </button>
                <div style="display: flex; gap: 8px; width: 100%;">
                  <button class="cancel-btn" (click)="retakePhoto()" style="flex: 1; margin: 0; padding: 10px;">
                    {{ ts.currentLang() === 'pl' ? 'Powtórz' : 'Переснять' }}
                  </button>
                  <button class="cancel-btn" (click)="closeScanner()" style="flex: 1; margin: 0; padding: 10px; border-color: rgba(239, 68, 68, 0.3); color: #f87171;">
                    {{ ts.currentLang() === 'pl' ? 'Anuluj' : 'Отмена' }}
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- STEP 2: OCR Parsing Spinner -->
          @if (scannerStep() === 'parsing') {
            <div class="parsing-container">
              <div class="spinner"></div>
              <h3>{{ ts.t('scanner.parsing') }}</h3>
              <p>{{ ts.t('scanner.searching') }}</p>
            </div>
          }

          <!-- STEP 3: Receipt Review & Accept -->
          @if (scannerStep() === 'review') {
            <div class="review-container">
              <div class="review-header">
                <span class="store-badge badge-biedronka">Biedronka</span>
                <h3>{{ ts.t('scanner.receipt_title') }}</h3>
                <span class="review-date">{{ ts.t('scanner.date') }}2026-06-07 | {{ ts.t('scanner.nip') }}7791011327</span>
              </div>
              
              <div class="review-items-list">
                @for (item of scannedReceiptItems(); track item.name) {
                  <div class="review-item-row">
                    <div class="item-desc">
                      <span class="name">{{ item.name }}</span>
                      <span class="details">{{ item.quantity }} x {{ item.unitPrice | number:'1.2-2' }} zł</span>
                    </div>
                    <div class="item-prices">
                      @if (item.discount > 0) {
                        <span class="orig-val">{{ (item.quantity * item.unitPrice) | number:'1.2-2' }} zł</span>
                        <span class="discount-val">-{{ item.discount | number:'1.2-2' }} zł</span>
                      }
                      <span class="final-val">{{ item.finalPrice | number:'1.2-2' }} zł</span>
                    </div>
                  </div>
                }
              </div>
              
              <div class="review-summary">
                <div class="sum-row">
                  <span>{{ ts.t('scanner.discount') }}</span>
                  <span class="savings-highlight">-23,72 zł</span>
                </div>
                <div class="sum-row total">
                  <span>{{ ts.t('scanner.total') }}</span>
                  <span>152,93 zł</span>
                </div>
              </div>
              
              <div class="review-actions">
                <button class="accept-btn" (click)="saveReceiptToHistory()">
                  {{ ts.t('scanner.save_action') }}
                </button>
                <button class="cancel-btn" (click)="closeScanner()">{{ ts.t('scanner.cancel') }}</button>
              </div>
            </div>
          }

        </div>
      </div>
    }

    <!-- TOAST NOTIFICATION -->
    @if (toast(); as t) {
      <div class="toast-notification" [class]="t.type">
        <div class="toast-icon">
          @if (t.type === 'success') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
        </div>
        <div class="toast-message">{{ t.message }}</div>
      </div>
    }
  `,
  styles: [`
    .list-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .scan-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .scan-btn svg {
      width: 16px;
      height: 16px;
    }
    
    /* Tab Switcher Styling */
    .tab-switcher {
      display: flex;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 20px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    }
    .tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tab-btn.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .scan-first-btn {
      margin-top: 12px;
      padding: 12px 20px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    .list-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;
      padding: 14px;
    }
    .item-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    }
    .item-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .item-price {
      font-size: 14px;
      font-weight: 600;
    }
    .delete-btn {
      background: none;
      border: none;
      color: #ef4444;
      opacity: 0.7;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .delete-btn:active {
      opacity: 1;
    }
    .summary-section h2 {
      margin-bottom: 12px;
    }
    .summary-cards {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }
    .summary-card {
      margin-bottom: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
    }
    .summary-card.cheapest {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }
    .store-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .winner-badge {
      background: #10b981;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .total-price {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .split-strategy-card {
      border-left: 4px solid #10b981;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);
    }
    .strategy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .strategy-header h3 {
      font-size: 14px;
      color: #fff;
    }
    .savings {
      font-size: 12px;
      color: #10b981;
      font-weight: 700;
    }
    .strategy-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }
    .strategy-split-total {
      font-size: 14px;
      color: #fff;
    }
    .strategy-split-total .highlight {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
    }
    .clear-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      margin-top: 16px;
      text-align: center;
    }
    .clear-btn:active {
      background: rgba(239, 68, 68, 0.2);
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
      font-size: 14px;
      gap: 8px;
    }
    .empty-state svg {
      opacity: 0.3;
      margin-bottom: 8px;
    }
    .sub-text {
      font-size: 12px;
      opacity: 0.7;
    }

    /* PANTRY STYLES */
    .pantry-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 80px;
    }
    .low-warning-banner {
      background: rgba(234, 179, 8, 0.15);
      border-color: rgba(234, 179, 8, 0.3);
      padding: 12px 16px;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: flashWarning 2s infinite ease-in-out;
    }
    @keyframes flashWarning {
      0%, 100% { border-color: rgba(234, 179, 8, 0.3); }
      50% { border-color: rgba(234, 179, 8, 0.6); }
    }
    .warning-icon {
      font-size: 18px;
    }
    .warning-text {
      font-size: 13px;
      color: #fef08a;
      font-weight: 600;
    }
    .pantry-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pantry-item {
      padding: 14px;
      margin-bottom: 0;
      border-color: rgba(255,255,255,0.06);
      transition: all 0.3s ease;
    }
    .pantry-item.pantry-low {
      border-left: 4px solid #f43f5e;
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(30, 41, 59, 0.6) 100%);
    }
    .pantry-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .pantry-title-group {
      display: flex;
      flex-direction: column;
    }
    .pantry-name {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .pantry-date {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    .low-badge {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .pulse {
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .pantry-progress-section {
      margin-bottom: 12px;
    }
    .progress-bar-wrap {
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease-in-out;
    }
    .bg-green {
      background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
    .bg-orange {
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }
    .bg-red {
      background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    }
    .progress-stats {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 4px;
      font-weight: 600;
    }
    .pantry-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 10px;
      gap: 10px;
    }
    .preset-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .preset-group label {
      font-size: 10px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .preset-chips {
      display: flex;
      gap: 4px;
    }
    .chip-btn {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      color: var(--text-secondary);
      border-radius: 6px;
      padding: 3px 6px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chip-btn.active {
      background: var(--accent-color);
      color: var(--bg-dark);
      border-color: var(--accent-color);
    }
    .re-buy-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .re-buy-btn:hover {
      background: #10b981;
      color: #fff;
      border-color: #10b981;
    }
    .re-buy-btn:active {
      transform: scale(0.95);
    }

    /* SCANNER MODAL STYLES */
    .scanner-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.85);
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .scanner-modal {
      width: 100%;
      max-width: 380px;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 28px;
      overflow: hidden;
      padding: 24px 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .viewfinder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .scanner-header {
      text-align: center;
    }
    .scanner-header h3 {
      font-size: 16px;
      color: #fff;
    }
    .scanner-header p {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    .camera-mock {
      width: 100%;
      height: 300px;
      background: #0f172a;
      border: 2px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }
    .scanner-laser {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(180deg, transparent, #10b981);
      box-shadow: 0 0 12px #10b981;
      animation: scan 2s infinite ease-in-out;
    }
    @keyframes scan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
    .camera-guideline {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }
    .capture-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
    }
    
    /* Parsing state */
    .parsing-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      gap: 16px;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(56, 189, 248, 0.1);
      border-left-color: var(--accent-color);
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Review state */
    .review-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .review-header {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }
    .review-header h3 {
      font-size: 16px;
      color: #fff;
      margin-top: 4px;
    }
    .review-date {
      font-size: 11px;
      color: var(--text-secondary);
      display: block;
      margin-top: 2px;
    }
    .review-items-list {
      max-height: 220px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 4px;
      scrollbar-width: thin;
    }
    .review-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding-bottom: 6px;
    }
    .item-desc {
      display: flex;
      flex-direction: column;
      max-width: 65%;
    }
    .item-desc .name {
      color: #fff;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-desc .details {
      color: var(--text-secondary);
      font-size: 10px;
      margin-top: 2px;
    }
    .item-prices {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .item-prices .orig-val {
      text-decoration: line-through;
      color: var(--text-secondary);
      font-size: 10px;
    }
    .item-prices .discount-val {
      color: #ef4444;
      font-size: 10px;
      font-weight: 600;
    }
    .item-prices .final-val {
      color: #fff;
      font-weight: 600;
    }
    .review-summary {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
    }
    .sum-row.total {
      border-top: 1px solid var(--border-color);
      padding-top: 6px;
      font-weight: 700;
      color: #fff;
      font-size: 16px;
    }
    .savings-highlight {
      color: #ef4444;
      font-weight: 700;
    }
    .review-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .accept-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: #10b981;
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    .cancel-btn {
      width: 100%;
      padding: 10px;
      border-radius: 12px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
    }
    .toast-notification {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-radius: 16px;
      z-index: 10000;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      animation: toast-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .toast-notification.success {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    .toast-notification.error {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
    }
    @keyframes toast-slide-in {
      0% {
        transform: translate(-50%, 40px);
        opacity: 0;
      }
      100% {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingListComponent {
  public ts = inject(TranslationService);
  private http = inject(HttpClient);
  listItems = signal<ListProduct[]>([]);
  activeTab = signal<'list' | 'pantry'>('list');
  toast = signal<{ message: string, type: 'success' | 'error' } | null>(null);

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast.set({ message, type });
    setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  // Pantry items state
  pantryItems = signal<PantryItem[]>([]);

  // Scanner signals
  scannerOpen = signal<boolean>(false);
  scannerStep = signal<'camera' | 'preview' | 'parsing' | 'review'>('camera');
  capturedImagePath = signal<string>('');
  capturedImageUrl = signal<string>('');
  
  scannedReceiptItems = signal<ScannedItem[]>([
    { name: 'PoduszkiNugVit350g', quantity: 1, unitPrice: 7.49, discount: 0, finalPrice: 7.49 },
    { name: 'TortillaPszenna306g', quantity: 3, unitPrice: 3.99, discount: 3.99, finalPrice: 7.98 },
    { name: 'Chleb Slowia 380g', quantity: 1, unitPrice: 4.29, discount: 0, finalPrice: 4.29 },
    { name: 'Jaja W wyb L 10szt', quantity: 2, unitPrice: 13.99, discount: 4.23, finalPrice: 23.75 },
    { name: 'SkrzSkrzydlaka500g', quantity: 1, unitPrice: 9.99, discount: 0, finalPrice: 9.99 },
    { name: 'Mleko bez lakt 2% 1L', quantity: 4, unitPrice: 3.69, discount: 2.80, finalPrice: 11.96 },
    { name: 'Twarog Poltt 250g', quantity: 2, unitPrice: 3.95, discount: 1.59, finalPrice: 6.31 },
    { name: 'SerekiH.Wysokobia200g', quantity: 2, unitPrice: 3.99, discount: 0, finalPrice: 7.98 },
    { name: 'Pomido-Paprycz500g', quantity: 1, unitPrice: 14.99, discount: 0, finalPrice: 14.99 },
    { name: 'KukurydzaGotow450g', quantity: 1, unitPrice: 5.99, discount: 0, finalPrice: 5.99 },
    { name: 'Jabl.Jonagold luz', quantity: 1.11, unitPrice: 4.99, discount: 1.11, finalPrice: 4.43 },
    { name: 'PizzaKurPiecz600g', quantity: 1, unitPrice: 16.99, discount: 0, finalPrice: 16.99 },
    { name: 'Torba T-SHIRT', quantity: 1, unitPrice: 0.79, discount: 0, finalPrice: 0.79 },
    { name: 'KawaMiel.Oryg.500g', quantity: 1, unitPrice: 39.99, discount: 10.00, finalPrice: 29.99 }
  ]);

  constructor() {
    this.loadList();
    this.loadPantry();
  }

  loadList() {
    const list = JSON.parse(localStorage.getItem('shopping_list') || '[]');
    this.listItems.set(list);
  }

  loadPantry() {
    const stored = localStorage.getItem('pantry_list');
    const hasScanned = localStorage.getItem('last_scanned_receipt') !== null;
    
    if (stored && hasScanned) {
      this.pantryItems.set(JSON.parse(stored));
    } else {
      this.pantryItems.set([]);
      localStorage.setItem('pantry_list', JSON.stringify([]));
    }
  }

  savePantry() {
    localStorage.setItem('pantry_list', JSON.stringify(this.pantryItems()));
  }

  setTab(tab: 'list' | 'pantry') {
    this.activeTab.set(tab);
  }

  removeItem(id: string) {
    const newList = this.listItems().filter(item => item.id !== id);
    this.listItems.set(newList);
    localStorage.setItem('shopping_list', JSON.stringify(newList));
  }

  clearList() {
    this.listItems.set([]);
    localStorage.setItem('shopping_list', '[]');
  }

  removePantryItem(id: string) {
    const newList = this.pantryItems().filter(item => item.id !== id);
    this.pantryItems.set(newList);
    this.savePantry();
    this.showToast('Продукт удален из кладовой', 'success');
  }

  clearPantry() {
    if (confirm(this.ts.currentLang() === 'pl' ? 'Czy na pewno chcesz wyczyścić całą spiżarnię?' : 'Вы уверены, что хотите полностью очистить кладовую?')) {
      this.pantryItems.set([]);
      this.savePantry();
      localStorage.removeItem('last_scanned_receipt');
      localStorage.removeItem('purchase_history_tags');
      this.showToast('Кладовая полностью очищена', 'success');
    }
  }

  // Scanner methods
  async openScanner() {
    this.scannerOpen.set(true);
    this.scannerStep.set('camera');
    this.capturedImagePath.set('');
    this.capturedImageUrl.set('');
    // Small delay to let the modal render before launching native camera
    await new Promise(r => setTimeout(r, 100));
    await this.capturePhoto();
  }

  closeScanner() {
    if (this.scannerStep() === 'parsing') {
      return; // Prevent closing while parsing/uploading
    }
    this.capturedImagePath.set('');
    this.capturedImageUrl.set(''); // Free memory
    this.scannerOpen.set(false);
  }

  async retakePhoto() {
    // Free previous image from memory before launching camera again
    this.capturedImagePath.set('');
    this.capturedImageUrl.set('');
    this.scannerStep.set('camera');
    // Wait a tick for iOS to dismiss any previous native controller
    await new Promise(r => setTimeout(r, 300));
    await this.capturePhoto();
  }

  private async capturePhoto() {
    try {
      let rawPath = '';
      let safeUrl = '';
      try {
        const result = await DocumentScanner.scanDocument({
          responseType: ResponseType.ImageFilePath, // Use file paths to save memory!
          letUserAdjustCrop: true,
          maxNumDocuments: 1
        });
        if (result.scannedImages && result.scannedImages.length > 0) {
          rawPath = result.scannedImages[0];
          safeUrl = Capacitor.convertFileSrc(rawPath);
        }
      } catch (scanErr) {
        console.warn('DocumentScanner failed or not available, falling back to standard Camera:', scanErr);
        const image = await Camera.getPhoto({
          quality: 85,
          width: 1600,
          allowEditing: true,
          resultType: CameraResultType.Uri, // Use Uri to save memory!
          source: CameraSource.Camera
        });
        rawPath = image.path || '';
        safeUrl = image.webPath || (rawPath ? Capacitor.convertFileSrc(rawPath) : '');
      }

      if (!rawPath) {
        throw new Error('Could not retrieve image path');
      }

      this.capturedImagePath.set(rawPath);
      this.capturedImageUrl.set(safeUrl);
      this.scannerStep.set('preview');

    } catch (err: any) {
      console.warn('Camera capture canceled or failed:', err.message || err);
      const errMsg = err.message || JSON.stringify(err) || 'Unknown error';
      
      // If user cancelled, go back to preview if we had an image, otherwise close
      if (errMsg.includes('cancelled') || errMsg.includes('canceled') || errMsg.includes('User cancelled')) {
        if (this.capturedImageUrl()) {
          this.scannerStep.set('preview');
        } else {
          this.scannerOpen.set(false);
        }
        return;
      }
      
      this.showToast('Ошибка запуска камеры: ' + errMsg, 'error');

      // Fallback: demo mode
      this.scannerStep.set('preview');
      this.capturedImagePath.set('');
      this.capturedImageUrl.set('');
    }
  }

  async uploadAndParse() {
    const rawPath = this.capturedImagePath();
    const safeUrl = this.capturedImageUrl();
    this.scannerStep.set('parsing');

    if (!rawPath || !safeUrl) {
      // Demo mode fallback
      setTimeout(() => {
        this.scannedReceiptItems.set([
          { name: 'PoduszkiNugVit350g', quantity: 1, unitPrice: 7.49, discount: 0, finalPrice: 7.49 },
          { name: 'TortillaPszenna306g', quantity: 3, unitPrice: 3.99, discount: 3.99, finalPrice: 7.98 },
          { name: 'Chleb Slowia 380g', quantity: 1, unitPrice: 4.29, discount: 0, finalPrice: 4.29 },
          { name: 'Jaja W wyb L 10szt', quantity: 2, unitPrice: 13.99, discount: 4.23, finalPrice: 23.75 }
        ]);
        this.scannerStep.set('review');
        this.showToast('Чек отсканирован в демо-режиме', 'success');
      }, 1500);
      return;
    }

    try {
      // Fetch file content as blob directly via native webview handling
      const response = await fetch(safeUrl);
      const blob = await response.blob();

      // Build Multipart form data to upload image to our NestJS OCR endpoint
      const formData = new FormData();
      formData.append('file', blob, 'receipt.jpg');

      this.http.post<any>(`${API_CONFIG.baseUrl}/receipts/scan`, formData).subscribe({
        next: (result) => {
          // Map results from backend OCR parser
          const mappedItems: ScannedItem[] = (result.items || []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.finalPrice || 0,
            discount: item.discount || 0,
            finalPrice: item.finalPrice || 0
          }));

          this.scannedReceiptItems.set(mappedItems);
          this.scannerStep.set('review');
          this.showToast('Чек успешно отсканирован и распознан!', 'success');
        },
        error: (err) => {
          console.error('OCR API Upload failed:', err);
          this.showToast('Не удалось загрузить или обработать чек', 'error');
          this.scannerStep.set('preview');
        }
      });
    } catch (fetchErr: any) {
      console.error('Failed to read image file:', fetchErr);
      this.showToast('Не удалось прочитать файл изображения: ' + (fetchErr.message || fetchErr), 'error');
      this.scannerStep.set('preview');
    }
  }


  saveReceiptToHistory() {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalSum = this.scannedReceiptItems().reduce((sum, item) => sum + item.finalPrice, 0);
    const historyItem = {
      date: todayStr,
      store: 'biedronka',
      total: Math.round(totalSum * 100) / 100,
      items: this.scannedReceiptItems()
    };
    
    localStorage.setItem('last_scanned_receipt', JSON.stringify(historyItem));
    
    const itemsBought = this.scannedReceiptItems().map(item => item.name);
    localStorage.setItem('purchase_history_tags', JSON.stringify(itemsBought));
    
    // Add to Pantry automatically!
    const newPantryItems: PantryItem[] = this.scannedReceiptItems().map((item, idx) => ({
      id: `pantry-scan-${idx}-${Math.random().toString().slice(2, 6)}`,
      name: this.formatItemName(item.name),
      purchaseDate: new Date().toISOString(),
      durationPreset: this.guessPreset(item.name)
    }));
    
    this.pantryItems.update(current => [...newPantryItems, ...current]);
    this.savePantry();

    this.closeScanner();
    this.showToast('Продукты из чека успешно добавлены!', 'success');
  }

  formatItemName(name: string): string {
    // Clean up typical receipt OCR noise
    return name
      .replace(/(\d+g|\d+szt|\d+L)/gi, ' $1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  guessPreset(name: string): 'day' | 'week' | 'month' | 'year' {
    const n = name.toLowerCase();
    if (n.includes('pizza') || n.includes('szyb') || n.includes('gotow')) return 'day';
    if (n.includes('kawa') || n.includes('twarog') || n.includes('poduszki')) return 'month';
    if (n.includes('torba') || n.includes('szampon') || n.includes('ariel') || n.includes('proszek') || n.includes('t-shirt')) return 'year';
    return 'week'; // default week
  }

  // Pantry duration preset update
  changePreset(id: string, preset: 'day' | 'week' | 'month' | 'year') {
    this.pantryItems.update(items => 
      items.map(item => item.id === id ? { ...item, durationPreset: preset } : item)
    );
    this.savePantry();
  }

  reBuyItem(pantryItem: PantryItem) {
    // Guess store and price
    const store = 'biedronka';
    const price = 5.99; // fallback demo price
    
    const currentList = JSON.parse(localStorage.getItem('shopping_list') || '[]');
    if (!currentList.some((it: any) => it.name === pantryItem.name)) {
      currentList.push({
        id: Math.random().toString(),
        name: pantryItem.name,
        store: store,
        price: price
      });
      localStorage.setItem('shopping_list', JSON.stringify(currentList));
      this.loadList();
      alert(this.ts.currentLang() === 'pl' ? `Dodano "${pantryItem.name}" z powrotem do listy!` : `Добавлено "${pantryItem.name}" обратно в список!`);
    }
  }

  formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return '';
    }
  }

  // Reactive computed pantry items with progress bars
  processedPantryItems = computed(() => {
    const now = new Date().getTime();
    
    return this.pantryItems().map(item => {
      const buyTime = new Date(item.purchaseDate).getTime();
      const diffMs = now - buyTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      let totalDays = 7;
      if (item.durationPreset === 'day') totalDays = 1;
      else if (item.durationPreset === 'week') totalDays = 7;
      else if (item.durationPreset === 'month') totalDays = 30;
      else if (item.durationPreset === 'year') totalDays = 365;
      
      const daysLeft = Math.max(0, Math.round((totalDays - diffDays) * 10) / 10);
      const percentLeft = Math.max(0, Math.round(((totalDays - diffDays) / totalDays) * 100));
      
      return {
        ...item,
        daysLeft,
        percentLeft,
        isLow: percentLeft < 30
      };
    });
  });

  lowItemsCount = computed(() => {
    return this.processedPantryItems().filter(item => item.isLow).length;
  });

  // Cost calculation signals (computed from listItems)
  totalBiedronka = computed(() => {
    return this.listItems().reduce((sum, item) => sum + (item.store === 'biedronka' ? item.price : item.price * 1.05), 0);
  });

  totalLidl = computed(() => {
    return this.listItems().reduce((sum, item) => sum + (item.store === 'lidl' ? item.price : item.price * 0.98), 0);
  });

  totalKaufland = computed(() => {
    return this.listItems().reduce((sum, item) => sum + (item.store === 'kaufland' ? item.price : item.price * 1.02), 0);
  });

  totalSplit = computed(() => {
    return this.listItems().reduce((sum, item) => sum + item.price, 0);
  });

  cheapestStore = computed(() => {
    const b = this.totalBiedronka();
    const l = this.totalLidl();
    const k = this.totalKaufland();
    
    if (b <= l && b <= k) return 'biedronka';
    if (l <= b && l <= k) return 'lidl';
    return 'kaufland';
  });

  totalSavings = computed(() => {
    const highestTotal = Math.max(this.totalBiedronka(), this.totalLidl(), this.totalKaufland());
    const savings = highestTotal - this.totalSplit();
    return savings > 0 ? savings : 0;
  });
}
