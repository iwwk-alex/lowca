import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, Subject, switchMap, of, tap } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { API_CONFIG } from '../../core/config/api.config';

interface CompareItem {
  id: string;
  name: string;
  store: 'biedronka' | 'lidl' | 'kaufland';
  price: number;
  originalPrice?: number;
  imgUrl?: string;
  unit: string;
  promo: string;
}

interface GroupedProduct {
  name: string;
  imgUrl?: string;
  prices: {
    [store in 'biedronka' | 'lidl' | 'kaufland']?: {
      price: number;
      originalPrice: number;
      promoText?: string;
      item: CompareItem;
    }
  };
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-header">
      <h1>{{ ts.t('compare.title') }}</h1>
    </header>

    <!-- Search Input -->
    <div class="search-bar-container">
      <input 
        type="text" 
        class="search-input" 
        [placeholder]="ts.t('compare.placeholder')" 
        [(ngModel)]="searchQuery"
        (ngModelChange)="onSearchChange($event)">
      @if (loading()) {
        <div class="spinner"></div>
      } @else {
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      }
    </div>

    <!-- Comparison Results -->
    <div class="results-container">
      @if (groupedProducts().length > 0) {
        <div class="products-grid">
          @for (prod of groupedProducts(); track prod.name) {
            <div class="glass-card product-compare-card">
              <!-- Top Image -->
              <div class="product-img-container">
                @if (prod.imgUrl) {
                  <img [src]="prod.imgUrl" [alt]="prod.name" class="product-img">
                } @else {
                  <div class="image-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                }
              </div>
              
              <!-- Product Details -->
              <div class="product-details">
                <h3 class="product-title">{{ prod.name }}</h3>
                
                <!-- Store Price List -->
                <div class="store-price-list">
                  <!-- Biedronka -->
                  <div class="store-price-row" [class.no-offer]="!prod.prices.biedronka">
                    <div class="store-left">
                      <span class="store-badge badge-biedronka">Biedronka</span>
                    </div>
                    @if (prod.prices.biedronka) {
                      <div class="price-info">
                        <span class="old-price">{{ prod.prices.biedronka.originalPrice | number:'1.2-2' }} zł</span>
                        <span class="current-price">{{ prod.prices.biedronka.price | number:'1.2-2' }} zł</span>
                      </div>
                      <button class="add-mini-btn" (click)="addToList(prod.prices.biedronka.item)">+</button>
                    } @else {
                      <span class="no-offer-text">{{ ts.currentLang() === 'pl' ? 'Brak oferty' : 'Нет предложения' }}</span>
                    }
                  </div>

                  <!-- Lidl -->
                  <div class="store-price-row" [class.no-offer]="!prod.prices.lidl">
                    <div class="store-left">
                      <span class="store-badge badge-lidl">Lidl</span>
                    </div>
                    @if (prod.prices.lidl) {
                      <div class="price-info">
                        <span class="old-price">{{ prod.prices.lidl.originalPrice | number:'1.2-2' }} zł</span>
                        <span class="current-price">{{ prod.prices.lidl.price | number:'1.2-2' }} zł</span>
                      </div>
                      <button class="add-mini-btn" (click)="addToList(prod.prices.lidl.item)">+</button>
                    } @else {
                      <span class="no-offer-text">{{ ts.currentLang() === 'pl' ? 'Brak oferty' : 'Нет предложения' }}</span>
                    }
                  </div>

                  <!-- Kaufland -->
                  <div class="store-price-row" [class.no-offer]="!prod.prices.kaufland">
                    <div class="store-left">
                      <span class="store-badge badge-kaufland">Kaufland</span>
                    </div>
                    @if (prod.prices.kaufland) {
                      <div class="price-info">
                        <span class="old-price">{{ prod.prices.kaufland.originalPrice | number:'1.2-2' }} zł</span>
                        <span class="current-price">{{ prod.prices.kaufland.price | number:'1.2-2' }} zł</span>
                      </div>
                      <button class="add-mini-btn" (click)="addToList(prod.prices.kaufland.item)">+</button>
                    } @else {
                      <span class="no-offer-text">{{ ts.currentLang() === 'pl' ? 'Brak oferty' : 'Нет предложения' }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>{{ ts.t('compare.empty_state') }}</p>
          <span style="font-size: 11px; opacity: 0.6;">{{ ts.t('compare.tip') }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-bar-container {
      position: relative;
      margin-bottom: 20px;
    }
    .search-input {
      width: 100%;
      padding: 14px 14px 14px 44px;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: #fff;
      font-size: 15px;
      outline: none;
      font-family: var(--font-sans);
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 10px rgba(56,189,248,0.15);
    }
    .search-icon, .spinner {
      position: absolute;
      left: 14px;
      top: 14px;
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      pointer-events: none;
    }
    .spinner {
      border: 2px solid rgba(255,255,255,0.1);
      border-top: 2px solid var(--accent-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .results-container {
      padding-bottom: 80px;
    }
    .products-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .product-compare-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0;
      border-color: rgba(255,255,255,0.06);
    }
    .product-img-container {
      height: 130px;
      width: 100%;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      position: relative;
    }
    .product-img {
      max-height: 85%;
      max-width: 85%;
      object-fit: contain;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }
    .image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    .image-placeholder svg {
      width: 48px;
      height: 48px;
    }
    .product-details {
      padding: 16px;
    }
    .product-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .store-price-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .store-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 8px 12px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .store-price-row:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255,255,255,0.08);
    }
    .store-price-row.no-offer {
      opacity: 0.35;
      background: transparent;
      border-style: dashed;
    }
    .store-left {
      display: flex;
      align-items: center;
      width: 90px;
    }
    .price-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-left: auto;
      margin-right: 12px;
    }
    .old-price {
      font-size: 11px;
      text-decoration: line-through;
      color: var(--text-secondary);
    }
    .current-price {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .no-offer-text {
      font-size: 12px;
      color: var(--text-secondary);
      font-style: italic;
      margin-left: auto;
    }
    .add-mini-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .add-mini-btn:hover {
      background: var(--accent-color);
      color: #000;
      border-color: var(--accent-color);
    }
    .add-mini-btn:active {
      transform: scale(0.92);
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
      font-size: 14px;
      gap: 12px;
    }
    .empty-state svg {
      opacity: 0.3;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComparisonComponent implements OnInit {
  private http = inject(HttpClient);
  public ts = inject(TranslationService);
  
  searchQuery = '';
  loading = signal(false);
  private searchSubject = new Subject<string>();

  items = signal<CompareItem[]>([]);

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(query => {
        if (!query) return of([]);
        return this.http.get<any[]>(`${API_CONFIG.baseUrl}/products/search?q=${encodeURIComponent(query)}`).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(data => {
      const mapped = data.map((item: any, i: number) => ({
        id: item.id || `s-${i}`,
        name: item.name,
        store: item.store,
        price: item.price,
        originalPrice: item.originalPrice || item.price * 1.2,
        imgUrl: item.imgUrl,
        unit: item.unit || '1 szt.',
        promo: item.promo || ''
      }));
      this.items.set(mapped);
      this.loading.set(false);
    });
  }

  normalizeName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('masło')) return 'Masło Ekstra 82%';
    if (n.includes('mleko')) return 'Mleko UHT 3.2%';
    if (n.includes('piersi') || n.includes('kurczak')) return 'Filet z piersi kurczaka';
    return name.split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  groupedProducts = computed(() => {
    const groups = new Map<string, GroupedProduct>();
    this.items().forEach(item => {
      const norm = this.normalizeName(item.name);
      if (!groups.has(norm)) groups.set(norm, { name: norm, prices: {} });
      const group = groups.get(norm)!;
      group.imgUrl = group.imgUrl || item.imgUrl;
      group.prices[item.store] = { price: item.price, originalPrice: item.originalPrice || item.price, promoText: item.promo, item };
    });
    return Array.from(groups.values());
  });

  onSearchChange(val: string) {
    this.searchSubject.next(val);
  }

  addToList(item: CompareItem) {
    const list = JSON.parse(localStorage.getItem('shopping_list') || '[]');
    if (!list.some((it: any) => it.name === item.name && it.store === item.store)) {
      list.push({ id: Math.random().toString(), name: item.name, store: item.store, price: item.price });
      localStorage.setItem('shopping_list', JSON.stringify(list));
    }
  }
}
