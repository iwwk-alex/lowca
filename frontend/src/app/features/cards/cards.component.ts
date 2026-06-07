import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

interface LoyaltyCard {
  id: string;
  store: 'biedronka' | 'lidl' | 'kaufland' | 'custom';
  name: string;
  cardNumber: string;
  color: string;
  textColor: string;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-header header-with-btn">
      <h1>{{ ts.t('cards.title') }}</h1>
      <button class="add-card-btn" (click)="openAddModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ ts.t('cards.add_title') }}
      </button>
    </header>

    <div class="cards-list">
      @for (card of cards(); track card.id) {
        <div 
          class="wallet-card" 
          [style.background]="card.color"
          [style.color]="card.textColor"
          (click)="openCard(card)">
          <div class="card-header">
            <span class="card-logo">{{ card.name }}</span>
            <svg class="chip-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          
          <div class="card-body">
            <div class="card-number-label">{{ ts.t('cards.number_label') }}</div>
            <div class="card-number">{{ formatCardNumber(card.cardNumber) }}</div>
          </div>
        </div>
      }
    </div>

    <!-- Active Barcode Sheet Modal -->
    @if (activeCard(); as card) {
      <div class="bottom-sheet-backdrop" (click)="closeCard()">
        <div class="bottom-sheet" (click)="$event.stopPropagation()">
          <div class="handle"></div>
          <span class="store-badge" [class]="'badge-' + card.store">{{ card.store }}</span>
          <h2>{{ ts.t('cards.card_title', { name: card.name }) }}</h2>
          
          <!-- Barcode Simulation Layout -->
          <div class="barcode-container">
            <div class="simulated-barcode">
              <div class="barcode-bars">
                @for (bar of barcodeBars; track $index) {
                  <div class="bar" [style.width.px]="bar.w" [style.margin-right.px]="bar.m"></div>
                }
              </div>
            </div>
            <div class="barcode-number">{{ card.cardNumber }}</div>
          </div>

          <div class="scan-instructions">
            {{ ts.t('cards.scan_instruction') }}
          </div>

          <div class="bottom-sheet-actions">
            <button class="close-card-btn" (click)="closeCard()">
              {{ ts.t('cards.close') }}
            </button>
            <button class="delete-card-btn" (click)="deleteCard(card.id)">
              {{ ts.currentLang() === 'pl' ? 'Usuń' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Card Modal -->
    @if (addModalOpen()) {
      <div class="modal-backdrop" (click)="closeAddModal()">
        <div class="glass-card add-card-modal" (click)="$event.stopPropagation()">
          <h3>{{ ts.t('cards.add_title') }}</h3>
          
          <form (ngSubmit)="saveNewCard()">
            <div class="form-group">
              <label>{{ ts.t('cards.store_name') }}</label>
              <select [(ngModel)]="newCardStore" name="store" (change)="onStoreChange()">
                <option value="biedronka">Biedronka</option>
                <option value="lidl">Lidl</option>
                <option value="kaufland">Kaufland</option>
                <option value="custom">{{ ts.t('cards.custom') }}</option>
              </select>
            </div>

            @if (newCardStore === 'custom') {
              <div class="form-group">
                <label>{{ ts.currentLang() === 'pl' ? 'Nazwa karty' : 'Название карты' }}</label>
                <input type="text" [(ngModel)]="newCardName" name="name" placeholder="np. Żabka" required />
              </div>
            }

            <div class="form-group">
              <label>{{ ts.t('cards.card_number') }}</label>
              <input 
                type="text" 
                [(ngModel)]="newCardNumber" 
                name="cardNumber" 
                placeholder="1234567890" 
                required 
                pattern="[0-9]+"
              />
            </div>

            <div class="form-group">
              <label>{{ ts.t('cards.card_color') }}</label>
              <div class="color-options">
                @for (opt of colorOptions; track opt.value) {
                  <button 
                    type="button" 
                    class="color-btn" 
                    [style.background]="opt.value" 
                    [class.selected]="selectedColor === opt.value"
                    (click)="selectedColor = opt.value">
                  </button>
                }
              </div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="save-btn">{{ ts.t('cards.save') }}</button>
              <button type="button" class="cancel-btn" (click)="closeAddModal()">{{ ts.t('cards.cancel') }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-with-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .add-card-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .add-card-btn:active {
      transform: scale(0.95);
    }
    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 80px;
    }
    .wallet-card {
      height: 160px;
      border-radius: 24px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .wallet-card:active {
      transform: scale(0.97);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .chip-icon {
      opacity: 0.5;
    }
    .card-number-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
    }
    .card-number {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .barcode-container {
      background: #fff;
      padding: 20px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 16px 0;
    }
    .simulated-barcode {
      width: 100%;
      height: 80px;
      background-color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .barcode-bars {
      display: flex;
      height: 100%;
      align-items: stretch;
    }
    .bar {
      background-color: #000;
      height: 100%;
    }
    .barcode-number {
      margin-top: 10px;
      color: #000;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 2px;
    }
    .scan-instructions {
      text-align: center;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .bottom-sheet-actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }
    .close-card-btn {
      flex: 2;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .close-card-btn:active {
      background: rgba(255,255,255,0.1);
    }
    .delete-card-btn {
      flex: 1;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 12px;
      padding: 12px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .delete-card-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    .delete-card-btn:active {
      transform: scale(0.95);
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

    /* Modal Backdrop */
    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .add-card-modal {
      width: 100%;
      max-width: 350px;
      padding: 20px;
      background: #1e293b;
      border-color: rgba(255,255,255,0.1);
      animation: zoomIn 0.25s ease-out;
    }
    @keyframes zoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .add-card-modal h3 {
      font-size: 16px;
      color: #fff;
      margin-bottom: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .form-group label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-group select, .form-group input {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    .color-options {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .color-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .color-btn.selected {
      border-color: #fff;
      transform: scale(1.1);
      box-shadow: 0 0 10px rgba(255,255,255,0.3);
    }
    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 20px;
    }
    .save-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: var(--accent-color);
      border: none;
      color: var(--bg-dark);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .save-btn:active {
      transform: scale(0.97);
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
      transition: all 0.2s ease;
    }
    .cancel-btn:active {
      transform: scale(0.97);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsComponent implements OnInit {
  public ts = inject(TranslationService);
  cards = signal<LoyaltyCard[]>([]);

  activeCard = signal<LoyaltyCard | null>(null);
  addModalOpen = signal<boolean>(false);

  // Form bindings
  newCardStore = 'biedronka';
  newCardName = 'Moja Biedronka';
  newCardNumber = '';
  selectedColor = 'linear-gradient(135deg, #e30613 0%, #f43f5e 100%)';

  colorOptions = [
    { value: 'linear-gradient(135deg, #e30613 0%, #f43f5e 100%)' }, // Red Biedronka
    { value: 'linear-gradient(135deg, #0050aa 0%, #1d4ed8 100%)' }, // Blue Lidl
    { value: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' }, // Dark Red Kaufland
    { value: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }, // Green
    { value: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)' }, // Purple
    { value: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)' }  // Gold
  ];

  barcodeBars = [
    { w: 2, m: 2 }, { w: 4, m: 1 }, { w: 1, m: 3 }, { w: 3, m: 2 },
    { w: 2, m: 1 }, { w: 4, m: 2 }, { w: 1, m: 1 }, { w: 3, m: 3 },
    { w: 2, m: 2 }, { w: 4, m: 1 }, { w: 1, m: 2 }, { w: 3, m: 2 },
    { w: 2, m: 1 }, { w: 4, m: 2 }, { w: 1, m: 3 }, { w: 3, m: 1 },
    { w: 2, m: 2 }, { w: 4, m: 2 }, { w: 1, m: 1 }, { w: 3, m: 2 },
    { w: 2, m: 2 }, { w: 4, m: 1 }, { w: 1, m: 3 }, { w: 3, m: 2 }
  ];

  ngOnInit() {
    this.loadCards();
  }

  loadCards() {
    const stored = localStorage.getItem('loyalty_cards');
    if (stored) {
      this.cards.set(JSON.parse(stored));
    } else {
      // Default set
      const defaults: LoyaltyCard[] = [
        {
          id: 'mb',
          store: 'biedronka',
          name: 'Moja Biedronka',
          cardNumber: '9901234567890',
          color: 'linear-gradient(135deg, #e30613 0%, #f43f5e 100%)',
          textColor: '#ffffff'
        },
        {
          id: 'lp',
          store: 'lidl',
          name: 'Lidl Plus',
          cardNumber: '4009990123456',
          color: 'linear-gradient(135deg, #0050aa 0%, #1d4ed8 100%)',
          textColor: '#ffffff'
        },
        {
          id: 'kc',
          store: 'kaufland',
          name: 'Kaufland Card',
          cardNumber: '2800123456789',
          color: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
          textColor: '#ffffff'
        }
      ];
      this.cards.set(defaults);
      localStorage.setItem('loyalty_cards', JSON.stringify(defaults));
    }
  }

  saveCards() {
    localStorage.setItem('loyalty_cards', JSON.stringify(this.cards()));
  }

  openCard(card: LoyaltyCard) {
    this.activeCard.set(card);
  }

  closeCard() {
    this.activeCard.set(null);
  }

  deleteCard(id: string) {
    this.cards.update(items => items.filter(c => c.id !== id));
    this.saveCards();
    this.closeCard();
  }

  openAddModal() {
    this.newCardStore = 'biedronka';
    this.newCardName = 'Moja Biedronka';
    this.newCardNumber = '';
    this.selectedColor = 'linear-gradient(135deg, #e30613 0%, #f43f5e 100%)';
    this.addModalOpen.set(true);
  }

  closeAddModal() {
    this.addModalOpen.set(false);
  }

  onStoreChange() {
    if (this.newCardStore === 'biedronka') {
      this.newCardName = 'Moja Biedronka';
      this.selectedColor = 'linear-gradient(135deg, #e30613 0%, #f43f5e 100%)';
    } else if (this.newCardStore === 'lidl') {
      this.newCardName = 'Lidl Plus';
      this.selectedColor = 'linear-gradient(135deg, #0050aa 0%, #1d4ed8 100%)';
    } else if (this.newCardStore === 'kaufland') {
      this.newCardName = 'Kaufland Card';
      this.selectedColor = 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)';
    } else {
      this.newCardName = '';
      this.selectedColor = 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)'; // Purple as default custom
    }
  }

  saveNewCard() {
    if (!this.newCardNumber.trim()) return;
    
    const name = this.newCardStore === 'custom' ? this.newCardName.trim() : this.newCardName;
    if (!name) return;

    const newCard: LoyaltyCard = {
      id: `card-${Math.random().toString().slice(2, 6)}`,
      store: this.newCardStore as LoyaltyCard['store'],
      name,
      cardNumber: this.newCardNumber.replace(/\s+/g, ''),
      color: this.selectedColor,
      textColor: '#ffffff'
    };

    this.cards.update(items => [...items, newCard]);
    this.saveCards();
    this.closeAddModal();
  }

  formatCardNumber(num: string): string {
    return num.replace(/(.{4})/g, '$1 ').trim();
  }
}
