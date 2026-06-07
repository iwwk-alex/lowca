import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { API_CONFIG } from '../../core/config/api.config';

interface Leaflet {
  id: string;
  store: 'biedronka' | 'lidl' | 'kaufland';
  title: string;
  validFrom: string;
  validTo: string;
  pages: number;
}

interface Hotspot {
  x: number; // percentage
  y: number; // percentage
  w: number; // width percentage
  h: number; // height percentage
  productName: string;
  price: number;
  promoText: string;
  imgUrl?: string;
}

@Component({
  selector: 'app-leaflets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-header">
      <h1>{{ ts.t('leaflets.title') }}</h1>
    </header>

    <!-- Store Selection Carousel -->
    <div class="store-scroller">
      @for (store of stores; track store) {
        <button 
          class="store-btn" 
          [class.active]="selectedStore() === store"
          (click)="selectStore(store)">
          {{ store | titlecase }}
        </button>
      }
    </div>

    <!-- Active Leaflet View -->
    @if (activeLeaflet(); as leaflet) {
      <div class="glass-card leaflet-container">
        <div class="leaflet-meta">
          <h3>{{ leaflet.title }}</h3>
          <span class="dates">{{ ts.t('leaflets.valid_from_to', { from: leaflet.validFrom, to: leaflet.validTo }) }}</span>
        </div>

        <!-- Simulated Leaflet Page Area -->
        <div class="leaflet-page-viewer">
          <!-- simulated background graphic using SVG and CSS -->
          <div class="simulated-page">
            <div class="page-num-indicator">{{ ts.t('leaflets.page') }} {{ currentPage() }} {{ ts.t('leaflets.of') }} {{ leaflet.pages }}</div>
            
            <!-- Graphic layout representation of leaflet page -->
            <div class="page-content-graphic">
              <!-- Header representing store -->
              <div class="leaflet-header" [class]="leaflet.store">
                <h2>{{ ts.t('leaflets.offer', { store: leaflet.store.toUpperCase() }) }}</h2>
              </div>

              <!-- Dynamic Product Cards representing flyer layout -->
              @for (spot of getPageHotspots(); track spot.productName) {
                <div 
                  class="leaflet-product-card"
                  [style.left.%]="spot.x"
                  [style.top.%]="spot.y"
                  [style.width.%]="spot.w"
                  [style.height.%]="spot.h"
                  (click)="showProductDetail(spot)">
                  
                  <div class="product-card-img-container">
                    @if (spot.imgUrl) {
                      <img [src]="spot.imgUrl" [alt]="spot.productName" class="leaflet-product-thumb">
                    } @else {
                      <svg class="placeholder-svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    }
                  </div>
                  
                  <div class="product-card-details">
                    <span class="product-card-name">{{ spot.productName }}</span>
                    <div class="product-card-prices">
                      <span class="product-card-price">{{ spot.price | number:'1.2-2' }} zł</span>
                    </div>
                  </div>
                  
                  <span class="pulse-dot-container">
                    <span class="pulse-dot"></span>
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Pager Controls -->
        <div class="leaflet-controls">
          <button class="nav-page-btn" [disabled]="currentPage() === 1" (click)="prevPage()">{{ ts.t('leaflets.prev') }}</button>
          <span>{{ currentPage() }} / {{ leaflet.pages }}</span>
          <button class="nav-page-btn" [disabled]="currentPage() === leaflet.pages" (click)="nextPage()">{{ ts.t('leaflets.next') }}</button>
        </div>
      </div>
    }

    <!-- Product Hotspot Sheet Modal -->
    @if (selectedProduct(); as prod) {
      <div class="bottom-sheet-backdrop" (click)="closeDetail()">
        <div class="bottom-sheet" (click)="$event.stopPropagation()">
          <div class="handle"></div>
          <span class="store-badge" [class]="'badge-' + selectedStore()">{{ selectedStore() }}</span>
          <h2>{{ prod.productName }}</h2>
          
          @if (prod.imgUrl) {
            <div class="sheet-img-container">
              <img [src]="prod.imgUrl" [alt]="prod.productName" class="sheet-product-img">
            </div>
          }
          
          <div class="sheet-promo-text">{{ prod.promoText }}</div>
          <div class="sheet-price-row">
            <span class="sheet-price">{{ prod.price | number:'1.2-2' }} zł</span>
          </div>
          <button class="add-to-list-btn" (click)="addToList(prod)">
            {{ ts.t('leaflets.add_to_list') }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .store-scroller {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 16px;
      scrollbar-width: none;
    }
    .store-scroller::-webkit-scrollbar {
      display: none;
    }
    .store-btn {
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .store-btn.active {
      background: var(--accent-color);
      color: var(--bg-dark);
      border-color: var(--accent-color);
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
    }
    .leaflet-container {
      padding: 12px;
    }
    .leaflet-meta {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }
    .leaflet-meta h3 {
      font-size: 16px;
      color: #fff;
    }
    .leaflet-meta .dates {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    .leaflet-page-viewer {
      width: 100%;
      aspect-ratio: 3/4;
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      border: 1px solid var(--border-color);
    }
    .simulated-page {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .page-num-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      z-index: 2;
    }
    .page-content-graphic {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #334155, #1e293b);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .leaflet-header {
      padding: 10px 12px;
      text-align: left;
      color: #fff;
    }
    .leaflet-header h2 {
      font-size: 13px !important;
      margin: 0;
      padding-right: 75px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .leaflet-header.biedronka {
      background: linear-gradient(to right, var(--color-biedronka-red), #e11d48);
    }
    .leaflet-header.lidl {
      background: linear-gradient(to right, var(--color-lidl), #1d4ed8);
    }
    .leaflet-header.kaufland {
      background: linear-gradient(to right, var(--color-kaufland), #b91c1c);
    }
    .leaflet-product-card {
      position: absolute;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      padding: 6px;
      overflow: hidden;
      justify-content: space-between;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .leaflet-product-card:active {
      transform: scale(0.96);
      background: rgba(15, 23, 42, 0.7);
      border-color: var(--accent-color);
    }
    .product-card-img-container {
      height: 52%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .leaflet-product-thumb {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
    .placeholder-svg {
      width: 24px;
      height: 24px;
      opacity: 0.3;
    }
    .product-card-details {
      display: flex;
      flex-direction: column;
      height: 44%;
      justify-content: space-between;
    }
    .product-card-name {
      font-size: 10px;
      color: #e2e8f0;
      font-weight: 500;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-card-prices {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .product-card-price {
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }
    .pulse-dot-container {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 2;
    }
    .sheet-img-container {
      width: 100%;
      height: 140px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .sheet-product-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--accent-color);
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(56, 189, 248, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
      }
    }
    .leaflet-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .nav-page-btn {
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
    }
    .nav-page-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .bottom-sheet-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      z-index: 100;
      display: flex;
      align-items: flex-end;
    }
    .bottom-sheet {
      width: 100%;
      background: #1e293b;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 24px 20px;
      box-shadow: 0 -10px 25px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .bottom-sheet .handle {
      width: 40px;
      height: 4px;
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
      align-self: center;
      margin-bottom: 8px;
    }
    .sheet-promo-text {
      color: #ef4444;
      font-weight: 600;
      font-size: 14px;
    }
    .sheet-price-row {
      margin: 8px 0;
    }
    .sheet-price {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }
    .add-to-list-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      text-align: center;
      transition: opacity 0.2s ease;
    }
    .add-to-list-btn:active {
      opacity: 0.8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeafletsComponent implements OnInit {
  private http = inject(HttpClient);
  public ts = inject(TranslationService);
  scrapedItems = signal<any[]>([]);

  stores: Array<'biedronka' | 'lidl' | 'kaufland'> = ['biedronka', 'lidl', 'kaufland'];
  selectedStore = signal<'biedronka' | 'lidl' | 'kaufland'>('biedronka');
  currentPage = signal<number>(1);
  selectedProduct = signal<Hotspot | null>(null);

  leaflets = signal<Leaflet[]>([
    { id: 'b1', store: 'biedronka', title: 'Codziennie Niskie Ceny', validFrom: '08.06', validTo: '13.06', pages: 4 },
    { id: 'l1', store: 'lidl', title: 'Tylko w Lidl', validFrom: '08.06', validTo: '10.06', pages: 3 },
    { id: 'k1', store: 'kaufland', title: 'Gazetka Kaufland', validFrom: '04.06', validTo: '10.06', pages: 4 }
  ]);

  activeLeaflet = computed(() => {
    return this.leaflets().find(l => l.store === this.selectedStore()) || null;
  });

  ngOnInit() {
    this.http.get<any[]>(`${API_CONFIG.baseUrl}/products`).pipe(
      catchError(err => {
        console.warn('Backend API down inside LeafletsComponent, using static public scraped-data.json fallback.', err);
        return this.http.get<any[]>('/scraped-data.json');
      })
    ).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.scrapedItems.set(data);
        }
      },
      error: (err) => {
        console.warn('Failed to load scraped data for leaflets, using mock products.', err);
      }
    });
  }

  selectStore(store: 'biedronka' | 'lidl' | 'kaufland') {
    this.selectedStore.set(store);
    this.currentPage.set(1);
    this.selectedProduct.set(null);
  }

  nextPage() {
    const active = this.activeLeaflet();
    if (active && this.currentPage() < active.pages) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  getPageHotspots(): Hotspot[] {
    const store = this.selectedStore();
    const page = this.currentPage();
    const items = this.scrapedItems().filter(item => item.store === store);

    if (items.length === 0) {
      return this.getMockHotspots(store, page);
    }

    // Calculate which items to show on this page (4 items per page)
    const itemsPerPage = 4;
    const startIndex = (page - 1) * itemsPerPage;
    const pageItems = items.slice(startIndex, startIndex + itemsPerPage);

    if (pageItems.length === 0 && items.length > 0) {
      return [];
    }

    const positions = [
      { x: 6, y: 20, w: 41, h: 32 },
      { x: 53, y: 20, w: 41, h: 32 },
      { x: 6, y: 56, w: 41, h: 32 },
      { x: 53, y: 56, w: 41, h: 32 }
    ];

    return pageItems.map((item, idx) => {
      const pos = positions[idx] || positions[0];
      return {
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
        productName: item.name,
        price: item.price,
        promoText: item.promoText || 'Super okazja!',
        imgUrl: item.imgUrl
      };
    });
  }

  getMockHotspots(store: string, page: number): Hotspot[] {
    if (store === 'biedronka' && page === 1) {
      return [
        { x: 20, y: 40, w: 60, h: 30, productName: 'Filet z kurczaka Kraina Mięs', price: 13.99, promoText: 'Supercena - taniej o 41%' }
      ];
    } else if (store === 'lidl' && page === 1) {
      return [
        { x: 20, y: 40, w: 60, h: 30, productName: 'Masło Pilos Extra 82% 200g', price: 3.49, promoText: 'Kup 3, drugi 60% taniej' }
      ];
    } else if (store === 'kaufland' && page === 1) {
      return [
        { x: 20, y: 40, w: 60, h: 30, productName: 'Kawa ziarnista Lavazza Crema 1kg', price: 49.99, promoText: 'Z kartą Kaufland Card taniej' }
      ];
    }

    return [
      { x: 30, y: 45, w: 40, h: 25, productName: 'Sok pomarańczowy 1L', price: 3.99, promoText: 'Wielopak: 2+1 gratis' }
    ];
  }

  showProductDetail(spot: Hotspot) {
    this.selectedProduct.set(spot);
  }

  closeDetail() {
    this.selectedProduct.set(null);
  }

  addToList(prod: Hotspot) {
    // Add to shopping list localstorage/service
    const currentList = JSON.parse(localStorage.getItem('shopping_list') || '[]');
    currentList.push({
      id: Math.random().toString(),
      name: prod.productName,
      store: this.selectedStore(),
      price: prod.price
    });
    localStorage.setItem('shopping_list', JSON.stringify(currentList));
    this.closeDetail();
  }
}
