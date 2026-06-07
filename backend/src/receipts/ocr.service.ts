import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import axios from 'axios';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Recognizes and parses receipt image directly using Gemini API (if key is set) or Tesseract fallback
   */
  async recognizeAndParse(imageBuffer: Buffer): Promise<any> {
    if (process.env.GEMINI_API_KEY) {
      this.logger.log('Using Gemini API for receipt OCR and parsing...');
      try {
        const base64Image = imageBuffer.toString('base64');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const payload = {
          contents: [{
            parts: [
              {
                text: "Analyze this Polish receipt image. Extract the structured data. Respond with a valid JSON object matching the schema. DO NOT include transaction/payment details, card details (Visa, Mastercard, etc.), container refunds (such as 'BON - zwrot opak'), discount totals, or VAT summaries as product items. Extract ONLY actual purchased product items. Here is the JSON schema: { store: string, nip: string, date: string (YYYY-MM-DD), items: [{ name: string (clean, recognizable product name without price noise), quantity: number, unitPrice: number, discount: number (positive float), finalPrice: number }], total: number, totalDiscounts: number }."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        };

        // Increased timeout to 35 seconds to avoid timeout failures on slow networks or large images
        const response = await axios.post(url, payload, { timeout: 35000 });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          this.logger.log('Successfully parsed receipt using Gemini API');
          return parsed;
        }
      } catch (err: any) {
        const details = err.response?.data ? JSON.stringify(err.response.data) : (err.stack || err.message);
        this.logger.error(`Gemini API OCR failed. Status: ${err.response?.status}. Details: ${details}`);
      }
    }

    this.logger.log('Falling back to local Tesseract OCR...');
    const recognizedText = await this.recognizeText(imageBuffer);
    return this.parseReceiptText(recognizedText);
  }

  /**
   * Recognizes text from a receipt image buffer or URL (Tesseract local fallback)
   */
  async recognizeText(imageBuffer: Buffer): Promise<string> {
    this.logger.log('Starting OCR recognition...');
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'pol+eng', // Scan for Polish (primary) and English
        {
          logger: m => this.logger.debug(`Tesseract progress: ${Math.round(m.progress * 100)}%`)
        }
      );
      this.logger.log('OCR recognition completed successfully.');
      return text;
    } catch (err) {
      this.logger.error('OCR processing failed:', err.message);
      throw new Error(`Failed to recognize text: ${err.message}`);
    }
  }

  /**
   * Parses structured Biedronka receipt from raw OCR text
   */
  parseReceiptText(text: string): { store: string; nip: string; date: string; items: any[]; total: number; totalDiscounts: number } {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const receipt = {
      store: 'Biedronka',
      nip: '',
      date: new Date().toISOString().split('T')[0],
      items: [] as any[],
      total: 0,
      totalDiscounts: 0
    };

    let currentItem: any = null;

    // Fast-regex patterns for parsing Polish receipt lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Detect NIP (tax identifier)
      if (line.includes('NIP')) {
        const nipMatch = line.match(/NIP\s*[:\-]?\s*(\d{10})/i) || line.match(/NIP\s*(\d+)/i);
        if (nipMatch) {
          receipt.nip = nipMatch[1];
        }
        continue;
      }

      // 2. Identify store from common tags
      if (/lidl/i.test(line)) receipt.store = 'Lidl';
      if (/kaufland/i.test(line)) receipt.store = 'Kaufland';
      if (/biedronka/i.test(line)) receipt.store = 'Biedronka';

      const isDetail = /^\d+(\.\d+)?\s*x/i.test(line) || line.includes(' x');
      const isDiscount = /^OPUST/i.test(line) || /^RABAT/i.test(line);
      const isExcludedLine = /SUMA|SPRZED|PTU|KARTA|KART|VISA|JISA|MAESTRO|MASTERCARD|CARD|BON|ZWROT|OPAK|RESZTA|CASH|GOTÓW|GOTOW|PLN|KASA|KASJER|TRANSAKC|DZIĘK|ZAPRASZ|STAWKA|OPODATK/i.test(line);

      // 3. Match items: Text followed by space and a letter category (e.g. "Maslo Ekstra  C")
      const itemHeaderMatch = line.match(/^(.+)\s+([A-D])$/);
      if (itemHeaderMatch && !isDetail && !isDiscount && !isExcludedLine) {
        currentItem = {
          name: itemHeaderMatch[1].trim(),
          taxCategory: itemHeaderMatch[2],
          quantity: 1,
          unitPrice: 0,
          subtotalPrice: 0,
          discount: 0,
          finalPrice: 0
        };
        receipt.items.push(currentItem);
        continue;
      }

      // 4. Quantity & price multiplier detail: e.g. "3 x3.99 11.97 C"
      const itemDetailsMatch = line.match(/^([\d.,]+)\s*x\s*([\d.,]+)\s+([\d.,]+)\s*([A-D])$/i);
      if (itemDetailsMatch && currentItem) {
        currentItem.quantity = parseFloat(itemDetailsMatch[1].replace(',', '.'));
        currentItem.unitPrice = parseFloat(itemDetailsMatch[2].replace(',', '.'));
        currentItem.subtotalPrice = parseFloat(itemDetailsMatch[3].replace(',', '.'));
        currentItem.finalPrice = currentItem.subtotalPrice;
        continue;
      }

      // 5. Discount parsing: e.g. "OPUST -3.99 C"
      const discountMatch = line.match(/^(?:OPUST|RABAT)\s+-?([\d.,]+)\s+([A-D])$/i);
      if (discountMatch && currentItem) {
        const discountVal = parseFloat(discountMatch[1].replace(',', '.'));
        currentItem.discount = discountVal;
        currentItem.finalPrice = Math.max(0, Math.round((currentItem.subtotalPrice - discountVal) * 100) / 100);
        continue;
      }

      // 6. SUMA / TOTAL PLN
      if (/SUMA\s+(?:PLN|RAZEM)/i.test(line) || /SUMA\s*:\s*([\d.,]+)/i.test(line)) {
        const totalMatch = line.match(/(?:PLN|SUMA|RAZEM)\s*[:\-]?\s*([\d.,]+)/i) || line.match(/([\d.,]+)\s*PLN/i) || line.match(/SUMA\s+PLN\s+([\d.,]+)/i);
        if (totalMatch) {
          receipt.total = parseFloat(totalMatch[1].replace(',', '.'));
        }
        continue;
      }

      // 7. Expiry or scan date
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        receipt.date = dateMatch[1];
      }
    }

    // Fallback: If no items were parsed due to bad OCR scan, extract generic lines as placeholders
    if (receipt.items.length === 0) {
      receipt.items = this.fallbackParseLines(lines);
      receipt.total = receipt.items.reduce((sum, item) => sum + item.finalPrice, 0);
    }

    return receipt;
  }

  private fallbackParseLines(lines: string[]): any[] {
    const items: any[] = [];
    // Grab lines containing prices
    lines.forEach((line, idx) => {
      const priceMatch = line.match(/(\d+[\s,.]\d{2})\s*(?:PLN|zł|[A-D])/i);
      const isExcludedLine = /SUMA|SPRZED|PTU|KARTA|KART|VISA|JISA|MAESTRO|MASTERCARD|CARD|BON|ZWROT|OPAK|RESZTA|CASH|GOTÓW|GOTOW|PLN|KASA|KASJER|TRANSAKC|DZIĘK|ZAPRASZ|STAWKA|OPODATK/i.test(line);
      
      if (priceMatch && !isExcludedLine) {
        const price = parseFloat(priceMatch[1].replace(' ', '').replace(',', '.'));
        const name = line.replace(priceMatch[0], '').trim() || `Pozycja ${idx + 1}`;
        if (name.length > 2) {
          items.push({
            name: name,
            quantity: 1,
            unitPrice: price,
            subtotalPrice: price,
            discount: 0,
            finalPrice: price
          });
        }
      }
    });
    return items.slice(0, 15);
  }
}
