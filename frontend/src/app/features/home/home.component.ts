import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { API_CONFIG } from '../../core/config/api.config';

interface Deal {
  id: string;
  store: 'biedronka' | 'lidl' | 'kaufland';
  product: string;
  price: number;
  originalPrice: number;
  validUntil: string;
  imgUrl?: string;
}

interface FrequentItem {
  id: string;
  name: string;
  store: 'biedronka' | 'lidl' | 'kaufland';
  price: number;
  originalPrice: number;
  purchaseCount: number;
  imgUrl?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="dashboard-header">
      <span class="welcome">{{ ts.t('home.welcome') }}</span>
      <h1>{{ ts.t('home.title') }}</h1>
    </header>

    <!-- Sunday Trade Banner -->
    <div class="glass-card sunday-widget">
      <div class="sunday-info">
        <div class="sunday-title">{{ ts.t('home.sunday_title') }}</div>
        <div class="sunday-status" [class.trade-open]="isSundayTradeOpen()">
          {{ isSundayTradeOpen() ? ts.t('home.sunday_open') : ts.t('home.sunday_closed') }}
        </div>
        <div class="sunday-date">{{ ts.t('home.sunday_next') }}</div>
      </div>
      <div class="timer-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>

    <!-- Home Tab Switcher -->
    <div class="tab-switcher home-tabs">
      <button class="tab-btn" [class.active]="activeTab() === 'deals'" (click)="setTab('deals')">
        {{ ts.t('home.tab_deals') }}
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'frequent'" (click)="setTab('frequent')">
        {{ ts.t('home.tab_frequent') }}
      </button>
    </div>

    <!-- Tab 1: Product of the Day for Each Store -->
    @if (activeTab() === 'deals') {
      <section class="deals-section">
        <div class="section-header">
          <h2>{{ ts.currentLang() === 'pl' ? 'Hity Dnia w Sklepach' : 'Хиты Дня в Магазинах' }}</h2>
        </div>

        <div class="deals-of-the-day-list">
          @for (deal of dealsOfTheDay(); track deal.id) {
            <div class="glass-card hit-deal-card" [class]="'hit-deal-' + deal.store">
              <div class="hit-glow" [class]="'glow-' + deal.store"></div>
              
              <div class="hit-card-content">
                <!-- Image Left/Right -->
                <div class="hit-img-container">
                  @if (deal.imgUrl) {
                    <img [src]="deal.imgUrl" [alt]="deal.product" class="hit-product-img">
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" width="48" height="48">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  }
                </div>

                <!-- Text Info -->
                <div class="hit-details">
                  <div class="hit-header-row">
                    <span class="store-badge" [class]="'badge-' + deal.store">{{ deal.store }}</span>
                    <span class="hit-badge">{{ ts.currentLang() === 'pl' ? 'HIT DNIA' : 'ХИТ ДНЯ' }}</span>
                  </div>
                  <h3 class="hit-title">{{ deal.product }}</h3>
                  
                  <div class="hit-price-row">
                    <div class="price-box">
                      <span class="current-price">{{ deal.price | number:'1.2-2' }} zł</span>
                      <span class="old-price">{{ deal.originalPrice | number:'1.2-2' }} zł</span>
                    </div>
                    <span class="discount-badge">-{{ getDiscountPct(deal.price, deal.originalPrice) }}%</span>
                  </div>
                  
                  <div class="hit-expiry">
                    {{ ts.t('home.only_until') }} {{ deal.validUntil }}
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>
    }

    <!-- Tab 2: Frequently Bought Items (Favorite/Constant) -->
    @if (activeTab() === 'frequent') {
      <section class="deals-section animate-fade-in">
        <div class="section-header">
          <h2>{{ ts.currentLang() === 'pl' ? 'Twoje Stałe Zakupy' : 'Ваши Постоянные Покупки' }}</h2>
        </div>

        @if (frequentPurchases().length > 0) {
          <div class="frequent-grid">
            @for (item of frequentPurchases(); track item.id) {
              <div class="glass-card frequent-card">
                <div class="frequent-header">
                  <span class="store-badge" [class]="'badge-' + item.store">{{ item.store }}</span>
                  <span class="purchase-count-badge">
                    ❤️ {{ item.purchaseCount }}x
                  </span>
                </div>

                <div class="frequent-img-container">
                  @if (item.imgUrl) {
                    <img [src]="item.imgUrl" [alt]="item.name" class="frequent-thumb">
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" width="36" height="36">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  }
                </div>

                <div class="frequent-details">
                  <h4 class="frequent-title">{{ item.name }}</h4>
                  <div class="frequent-price-row">
                    <span class="price">{{ item.price | number:'1.2-2' }} zł</span>
                    <button class="add-mini-btn" (click)="addToList(item)">+</button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Empty State -->
          <div class="glass-card empty-frequent-card">
            <div class="heart-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>{{ ts.currentLang() === 'pl' ? 'Brak stałych zakupów' : 'Пока нет частых покупок' }}</h3>
            <p>
              {{ ts.currentLang() === 'pl' 
                ? 'Zeskanuj paragony w zakładce "Lista", aby automatycznie wyznaczyć produkty kupowane najczęściej.' 
                : 'Отсканируйте чеки во вкладке "Список", чтобы приложение автоматически определило товары, которые вы покупаете регулярно.' }}
            </p>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .dashboard-header {
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .welcome {
      font-size: 13px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sunday-widget {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
      border-left: 4px solid var(--accent-color);
      overflow: hidden;
      margin-bottom: 20px;
    }
    .sunday-title {
      font-weight: 600;
      font-size: 15px;
      color: #fff;
    }
    .sunday-status {
      font-size: 12px;
      color: #f43f5e;
      margin-top: 4px;
      font-weight: 500;
    }
    .sunday-status.trade-open {
      color: #10b981;
    }
    .sunday-date {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
    .timer-badge svg {
      width: 36px;
      height: 36px;
      color: rgba(255, 255, 255, 0.15);
    }
    
    /* Home Tab Switcher */
    .tab-switcher.home-tabs {
      display: flex;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 24px;
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
      outline: none;
    }
    .tab-btn.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    
    .section-header {
      margin-bottom: 16px;
    }

    /* Product of the day list */
    .deals-of-the-day-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 80px;
    }
    .hit-deal-card {
      position: relative;
      overflow: hidden;
      padding: 16px;
      border-color: rgba(255,255,255,0.06);
      transition: all 0.3s ease;
    }
    .hit-deal-card:active {
      transform: scale(0.98);
    }
    .hit-glow {
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.15;
      pointer-events: none;
    }
    .glow-biedronka { background: #e30613; }
    .glow-lidl { background: #0050aa; }
    .glow-kaufland { background: #b91c1c; }

    .hit-card-content {
      display: flex;
      gap: 16px;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    .hit-img-container {
      width: 90px;
      height: 90px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    .hit-product-img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
    .hit-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hit-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hit-badge {
      background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
      color: #000;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
    }
    .hit-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin: 4px 0;
      line-height: 1.3;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      height: 36px;
    }
    .hit-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }
    .price-box {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .current-price {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
    }
    .old-price {
      font-size: 12px;
      text-decoration: line-through;
      color: var(--text-secondary);
    }
    .discount-badge {
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .hit-expiry {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Frequent purchases tab */
    .frequent-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-bottom: 80px;
    }
    .frequent-card {
      padding: 12px;
      margin-bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 190px;
      border-color: rgba(255,255,255,0.05);
    }
    .frequent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .purchase-count-badge {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.25);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    .frequent-img-container {
      height: 70px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 4px 0;
    }
    .frequent-thumb {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .frequent-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .frequent-title {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin: 0;
    }
    .frequent-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .frequent-price-row .price {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent-color);
    }
    .add-mini-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
    .add-mini-btn:hover {
      background: var(--accent-color);
      color: #000;
    }

    /* Empty state */
    .empty-frequent-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
      gap: 12px;
      background: rgba(30, 41, 59, 0.4);
      border-color: rgba(255,255,255,0.06);
    }
    .heart-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(244, 63, 94, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
      color: #f43f5e;
      margin-bottom: 8px;
    }
    .heart-icon-wrapper svg {
      width: 24px;
      height: 24px;
    }
    .empty-frequent-card h3 {
      font-size: 15px;
      color: #fff;
      margin: 0;
    }
    .empty-frequent-card p {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  public ts = inject(TranslationService);
  
  isSundayTradeOpen = signal<boolean>(false);
  activeTab = signal<'deals' | 'frequent'>('deals');
  allScrapedProducts = signal<any[]>([]);

  topDeals = signal<Deal[]>([
    {
      id: '1',
      store: 'biedronka',
      product: 'Pierś z kurczaka Kraina Mięs 1kg',
      price: 13.99,
      originalPrice: 23.90,
      validUntil: '10.06'
    },
    {
      id: '2',
      store: 'lidl',
      product: 'Masło Pilos ekstra 82% 200g',
      price: 3.49,
      originalPrice: 6.99,
      validUntil: '09.06'
    },
    {
      id: '3',
      store: 'kaufland',
      product: 'Kawa ziarnista Lavazza Crema 1kg',
      price: 49.99,
      originalPrice: 89.99,
      validUntil: '10.06'
    }
  ]);

  ngOnInit() {
    this.http.get<any[]>(`${API_CONFIG.baseUrl}/products`).pipe(
      catchError(err => {
        console.warn('Backend API down, using static public scraped-data.json fallback.', err);
        return this.http.get<any[]>('/scraped-data.json');
      })
    ).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          this.allScrapedProducts.set(data);

          // Map to Deal interface
          const mappedDeals: Deal[] = data.slice(0, 10).map((item: any, index: number) => ({
            id: item.id || `scraped-${index}`,
            store: item.store,
            product: item.name,
            price: item.price,
            originalPrice: item.originalPrice || Math.round(item.price * 1.4 * 100) / 100,
            validUntil: '14.06',
            imgUrl: item.imgUrl
          }));
          this.topDeals.set(mappedDeals);
        }
      },
      error: (err: any) => {
        console.warn('Failed to load scraped data, using fallback mock deals.', err);
      }
    });
  }

  setTab(tab: 'deals' | 'frequent') {
    this.activeTab.set(tab);
  }

  getDiscountPct(current: number, original: number): number {
    return Math.round(((original - current) / original) * 100);
  }

  // Filter top deals to get exactly one deal per store as the "Product of the Day"
  dealsOfTheDay = computed(() => {
    const deals = this.topDeals();
    const stores: ('biedronka' | 'lidl' | 'kaufland')[] = ['biedronka', 'lidl', 'kaufland'];
    
    return stores.map(store => {
      const storeDeal = deals.find(d => d.store === store);
      if (storeDeal) return storeDeal;
      
      // Strict fallback if not loaded yet
      return {
        id: `fallback-${store}`,
        store,
        product: store === 'biedronka' 
          ? 'Pierś z kurczaka Kraina Mięs 1kg' 
          : store === 'lidl' 
            ? 'Masło Pilos ekstra 82% 200g' 
            : 'Kawa ziarnista Lavazza Crema 1kg',
        price: store === 'biedronka' ? 13.99 : store === 'lidl' ? 3.49 : 49.99,
        originalPrice: store === 'biedronka' ? 23.90 : store === 'lidl' ? 6.99 : 89.99,
        validUntil: '10.06'
      };
    });
  });

  // Calculate frequent purchases reactively from history tags
  frequentPurchases = computed(() => {
    const tagsStr = localStorage.getItem('purchase_history_tags');
    if (!tagsStr) return [];
    
    try {
      const tags: string[] = JSON.parse(tagsStr);
      const allProducts = this.allScrapedProducts();
      
      const result: FrequentItem[] = [];
      const uniqueTags = Array.from(new Set(tags.map(t => t.trim().toLowerCase())));
      
      uniqueTags.forEach((tag, idx) => {
        // Find a matching product in scraped data
        const match = allProducts.find(p => p.name.toLowerCase().includes(tag.substring(0, 5)));
        const purchaseCount = idx % 2 === 0 ? 3 : 2; // mock purchase count
        
        if (match) {
          result.push({
            id: `frequent-${match.id || idx}`,
            name: match.name,
            store: match.store,
            price: match.price,
            originalPrice: Math.round(match.price * 1.35 * 100) / 100,
            purchaseCount,
            imgUrl: match.imgUrl
          });
        } else {
          // Clean name for display
          let cleanName = tag;
          if (tag.length > 5) {
            cleanName = tag.charAt(0).toUpperCase() + tag.slice(1);
          }
          
          result.push({
            id: `frequent-fallback-${idx}`,
            name: cleanName,
            store: idx % 3 === 0 ? 'biedronka' : idx % 3 === 1 ? 'lidl' : 'kaufland',
            price: idx % 2 === 0 ? 4.99 : 2.49,
            originalPrice: idx % 2 === 0 ? 6.99 : 3.49,
            purchaseCount,
            imgUrl: undefined
          });
        }
      });
      
      return result.slice(0, 8); // show max 8
    } catch {
      return [];
    }
  });

  addToList(item: any) {
    const currentList = JSON.parse(localStorage.getItem('shopping_list') || '[]');
    if (!currentList.some((it: any) => it.name === item.name && it.store === item.store)) {
      currentList.push({
        id: Math.random().toString(),
        name: item.name || item.product,
        store: item.store,
        price: item.price
      });
      localStorage.setItem('shopping_list', JSON.stringify(currentList));
      alert(this.ts.currentLang() === 'pl' ? `Dodano "${item.name}" do listy!` : `Добавлено "${item.name}" в список!`);
    }
  }
}
