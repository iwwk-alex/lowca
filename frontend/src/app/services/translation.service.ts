import { Injectable, signal } from '@angular/core';

export type Lang = 'pl' | 'ru';

export const TRANSLATIONS: { [key in Lang]: { [key: string]: string } } = {
  pl: {
    // Navigation
    'nav.home': 'Główna',
    'nav.leaflets': 'Gazetki',
    'nav.compare': 'Porównaj',
    'nav.list': 'Lista',
    'nav.cards': 'Karty',
    
    // HomeComponent
    'home.welcome': 'Cześć! Oszczędzaj dziś',
    'home.title': 'Łowca',
    'home.tab_deals': 'Towary Dnia',
    'home.tab_frequent': 'Często Kupowane',
    'home.sunday_title': 'Niedziela Handlowa',
    'home.sunday_open': 'Najbliższa niedziela jest HANDLOWA!',
    'home.sunday_closed': 'Zakaz handlu w najbliższą niedzielę',
    'home.sunday_next': 'Kolejna niedziela handlowa: 28 czerwca 2026 r.',
    'home.deals_title': 'Gorące okazje dnia',
    'home.see_all': 'Wszystkie',
    'home.recs_title': 'Dla Ciebie (z paragonu) 💡',
    'home.dopasowane': 'Dopasowane',
    'home.only_until': 'Tylko do',
    'home.opt_for_you': 'Zoptymalizowano dla Ciebie',
    
    // LeafletsComponent
    'leaflets.title': 'Aktualne Gazetki',
    'leaflets.valid_from_to': 'Ważna: {from} - {to}',
    'leaflets.offer': 'OFERTA {store}',
    'leaflets.prev': 'Poprzednia',
    'leaflets.next': 'Następna',
    'leaflets.page': 'Strona',
    'leaflets.of': 'z',
    'leaflets.super_price': 'Super Cena!',
    'leaflets.add_to_list': 'Dodaj do listy zakupów',
    'leaflets.added': 'Dodano do listy!',
    
    // ComparisonComponent
    'compare.title': 'Porównywarka Cen',
    'compare.placeholder': 'Wyszukaj np. Nożyczki, Klapki, Parkside...',
    'compare.empty_state': 'Wpisz szukaną frazę, aby porównać ceny w sklepach Biedronka, Lidl i Kaufland',
    'compare.tip': 'Wskazówka: spróbuj wyszukać słowa kluczowe z najnowszych ofert, np. "joie", "klapki", "parkside", "legowisko".',
    'compare.cat.flyer': 'Oferty z gazetek',
    'compare.cat.butter': 'Masło (200g)',
    'compare.cat.milk': 'Mleko (1L)',
    'compare.cat.chicken': 'Filet z kurczaka (1kg)',
    'compare.cat.kitchen': 'Przybory Kuchenne',
    'compare.cat.clothing': 'Odzież i obuwie',
    'compare.cat.pets': 'Artykuły dla zwierząt',
    'compare.cat.alcohol': 'Napoje alkoholowe',
    'compare.cat.tools': 'Narzędzia warsztatowe',
    
    // ShoppingListComponent
    'list.title': 'Lista Zakupów',
    'list.scan': 'Skanuj',
    'list.clear': 'Wyczyść całą listę',
    'list.empty_title': 'Twoja lista zakupów jest pusta',
    'list.empty_sub': 'Dodaj produkty z gazetek lub zeskanuj paragon',
    'list.scan_first': 'Zeskanuj pierwszy paragon',
    'list.compare': 'Porównanie koszyka',
    'list.cheapest': 'Najtaniej',
    'list.smart_split': 'Inteligentny podział zakupów 💡',
    'list.save': 'Zaoszczędź: {amount} zł',
    'list.smart_desc': 'Kupuj poszczególne produkty tam, gdzie są najtańsze w tym tygodniu.',
    'list.split_total': 'Suma dzielona: ',
    
    // Scanner Modal
    'scanner.title': 'Skanowanie paragonu Biedronka',
    'scanner.guideline': 'Skieruj aparat na paragon fiskalny...',
    'scanner.align': 'Wyrównaj krawędzie paragonu',
    'scanner.photo': 'Zrób zdjęcie чека',
    'scanner.parsing': 'Analiza paragonu (OCR)...',
    'scanner.searching': 'Wyszukiwanie NIP, daty, cen i rabatów...',
    'scanner.receipt_title': 'Paragon Fiskalny',
    'scanner.date': 'Data: ',
    'scanner.nip': 'NIP: ',
    'scanner.discount': 'Suma zniżek (Opusty):',
    'scanner.total': 'SUMA PLN:',
    'scanner.save_action': 'Zapisz i analizuj koszyk',
    'scanner.cancel': 'Anuluj',
    'scanner.success_alert': 'Paragon zapisany! Twój koszyk został przeanalizowany. Na stronie głównej znajdziesz teraz dopasowane promocje!',
    
    // CardsComponent
    'cards.title': 'Karty Lojalnościowe',
    'cards.number_label': 'Numer karty',
    'cards.card_title': 'Karta {name}',
    'cards.scan_instruction': 'Skieruj ekran na czytnik w kasie samoobsługowej',
    'cards.close': 'Zamknij',

    // New keys: Login, Pantry Tracker, Custom Cards
    'login.title': 'Zaloguj się',
    'login.subtitle': 'Łowca — wygodne oszczędzanie z Biedronka, Lidl & Kaufland',
    'login.email': 'Adres E-mail',
    'login.password': 'Hasło',
    'login.button': 'Zaloguj się',
    'login.guest': 'Wejdź jako gość (Test)',
    'login.logout': 'Wyloguj',
    'pantry.title': 'Analiza zapasów (Pantry)',
    'pantry.preset': 'Okres zużycia',
    'pantry.preset_day': 'Dzień',
    'pantry.preset_week': 'Tydzień',
    'pantry.preset_month': 'Miesiąc',
    'pantry.preset_year': 'Rok',
    'pantry.running_out': 'Kończy się!',
    'pantry.add_back': 'Kup ponownie',
    'cards.add_title': 'Dodaj nową kartę',
    'cards.store_name': 'Nazwa sklepu',
    'cards.card_number': 'Numer karty (kod kreskowy)',
    'cards.card_color': 'Kolor karty (gradient)',
    'cards.save': 'Zapisz kartę',
    'cards.cancel': 'Anuluj',
    'cards.custom': 'Niestandardowa'
  },
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.leaflets': 'Газеты',
    'nav.compare': 'Сравнить',
    'nav.list': 'Список',
    'nav.cards': 'Карты',
    
    // HomeComponent
    'home.welcome': 'Привет! Экономь сегодня',
    'home.title': 'Łowca',
    'home.tab_deals': 'Товары Дня',
    'home.tab_frequent': 'Часто Покупаемые',
    'home.sunday_title': 'Торговое воскресенье',
    'home.sunday_open': 'Ближайшее воскресенье — ТОРГОВОЕ!',
    'home.sunday_closed': 'Запрет торговли в ближайшее воскресенье',
    'home.sunday_next': 'Следующее торговое воскресенье: 28 июня 2026 г.',
    'home.deals_title': 'Горячие акции дня',
    'home.see_all': 'Все',
    'home.recs_title': 'Для Вас (из чека) 💡',
    'home.dopasowane': 'Подобрано',
    'home.only_until': 'Только до',
    'home.opt_for_you': 'Оптимизировано под ваши покупки',
    
    // LeafletsComponent
    'leaflets.title': 'Текущие Газетки',
    'leaflets.valid_from_to': 'Действительна: {from} - {to}',
    'leaflets.offer': 'АКЦИЯ {store}',
    'leaflets.prev': 'Назад',
    'leaflets.next': 'Вперед',
    'leaflets.page': 'Страница',
    'leaflets.of': 'из',
    'leaflets.super_price': 'Супер Цена!',
    'leaflets.add_to_list': 'Добавить в список покупок',
    'leaflets.added': 'Добавлено в список!',
    
    // ComparisonComponent
    'compare.title': 'Сравнение Цен',
    'compare.placeholder': 'Искать, например, ножницы, шлепанцы, Parkside...',
    'compare.empty_state': 'Введите поисковый запрос, чтобы сравнить цены в магазинах Biedronka, Lidl и Kaufland',
    'compare.tip': 'Подсказка: попробуйте искать ключевые слова из последних акций, например, "joie", "klapki", "parkside", "legowisko".',
    'compare.cat.flyer': 'Акции из газеток',
    'compare.cat.butter': 'Масло (200г)',
    'compare.cat.milk': 'Молоко (1л)',
    'compare.cat.chicken': 'Филе курицы (1кг)',
    'compare.cat.kitchen': 'Кухонные принадлежности',
    'compare.cat.clothing': 'Одежда и обувь',
    'compare.cat.pets': 'Товары для животных',
    'compare.cat.alcohol': 'Алкогольные напитки',
    'compare.cat.tools': 'Инструменты',
    
    // ShoppingListComponent
    'list.title': 'Список Покупок',
    'list.scan': 'Сканировать',
    'list.clear': 'Очистить список',
    'list.empty_title': 'Ваш список покупок пуст',
    'list.empty_sub': 'Добавьте товары из газеток или отсканируйте чек',
    'list.scan_first': 'Отсканировать первый чек',
    'list.compare': 'Сравнение корзины',
    'list.cheapest': 'Дешевле всего',
    'list.smart_split': 'Умное разделение покупок 💡',
    'list.save': 'Экономия: {amount} zł',
    'list.smart_desc': 'Покупайте товары в тех магазинах, где они дешевле на этой неделе.',
    'list.split_total': 'Сумма по частям: ',
    
    // Scanner Modal
    'scanner.title': 'Сканирование чека Biedronka',
    'scanner.guideline': 'Наведите камеру на фискальный чек...',
    'scanner.align': 'Выровняйте края чека',
    'scanner.photo': 'Сделать снимок чека',
    'scanner.parsing': 'Анализ чека (OCR)...',
    'scanner.searching': 'Поиск NIP, даты, цен и скидок...',
    'scanner.receipt_title': 'Фискальный Чек',
    'scanner.date': 'Дата: ',
    'scanner.nip': 'NIP: ',
    'scanner.discount': 'Сумма скидок:',
    'scanner.total': 'ИТОГО PLN:',
    'scanner.save_action': 'Сохранить и анализировать корзину',
    'scanner.cancel': 'Отмена',
    'scanner.success_alert': 'Чек сохранен! Ваш список покупок проанализирован. На главной странице теперь доступны подобранные акции!',
    
    // CardsComponent
    'cards.title': 'Карты Лояльности',
    'cards.number_label': 'Номер карты',
    'cards.card_title': 'Карта {name}',
    'cards.scan_instruction': 'Наведите экран на сканер на кассе самообслуживания',
    'cards.close': 'Закрыть',

    // New keys: Login, Pantry Tracker, Custom Cards
    'login.title': 'Войти в систему',
    'login.subtitle': 'Łowca — удобная экономия с Biedronka, Lidl & Kaufland',
    'login.email': 'Электронная почта',
    'login.password': 'Пароль',
    'login.button': 'Войти',
    'login.guest': 'Войти как гость (Тест)',
    'login.logout': 'Выйти',
    'pantry.title': 'Анализ запасов (Кладовая)',
    'pantry.preset': 'Срок расхода',
    'pantry.preset_day': 'День',
    'pantry.preset_week': 'Неделя',
    'pantry.preset_month': 'Месяц',
    'pantry.preset_year': 'Год',
    'pantry.running_out': 'Заканчивается!',
    'pantry.add_back': 'Купить снова',
    'cards.add_title': 'Добавить новую карту',
    'cards.store_name': 'Название магазина',
    'cards.card_number': 'Номер карты (штрихкод)',
    'cards.card_color': 'Цвет карты (градиент)',
    'cards.save': 'Сохранить карту',
    'cards.cancel': 'Отмена',
    'cards.custom': 'Другая'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  currentLang = signal<Lang>('pl');

  constructor() {
    const saved = localStorage.getItem('preferred_lang') as Lang;
    if (saved === 'pl' || saved === 'ru') {
      this.currentLang.set(saved);
    }
  }

  setLanguage(lang: Lang) {
    this.currentLang.set(lang);
    localStorage.setItem('preferred_lang', lang);
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'pl' ? 'ru' : 'pl');
  }

  t(key: string, params?: { [key: string]: string | number | null }): string {
    const lang = this.currentLang();
    const langDict = TRANSLATIONS[lang] || TRANSLATIONS['pl'];
    let text = langDict[key] || TRANSLATIONS['pl'][key] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        const val = params[param];
        text = text.replace(`{${param}}`, val !== null && val !== undefined ? String(val) : '');
      });
    }
    return text;
  }
}
