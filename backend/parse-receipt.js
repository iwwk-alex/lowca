const fs = require('fs');

const rawReceiptText = `
BIEDRONKA "CODZIENNIE NISKIE CENY" 1429
15-883 BIAŁYSTOK UL. WYSZYŃSKIEGO 21
JERONIMO MARTINS POLSKA S.A.
62-025 KOSTRZYN UL. ŻNIWNA 5
NIP 7791011327
PARAGON FISKALNY
PoduszkiNugVit350g        C
                       1 x7.49 7.49 C
TortillaPszenna306g       C
                      3 x3.99 11.97 C
OPUST                           -3.99 C
                                 7.98
Chleb Stowia 380g         C
                       1 x4.29 4.29 C
Jaja W wyb L 10szt        C
                      2 x13.99 27.98 C
OPUST                           -4.23 C
                                23.75
SkrzSkrzydlaka500g        C
                       1 x9.99 9.99 C
Mleko bez lakt 2% 1L      C
                      4 x3.69 14.76 C
OPUST                           -2.80 C
                                11.96
Twarog Poltt 250g         C
                       2 x3.95 7.90 C
OPUST                           -1.59 C
                                 6.31
SerekiH.Wysokobia200g     C
                       2 x3.99 7.98 C
Pomido-Paprycz500g        C
                      1 x14.99 14.99 C
KukurydzaGotow450g        C
                       1 x5.99 5.99 C
Jabl.Jonagold luz         C
                  1.110 x4.99 5.54 C
OPUST                           -1.11 C
                                 4.43
PizzaKurPiecz600g         C
                      1 x16.99 16.99 C
Torba T-SHIRT             A
                       1 x0.79 0.79 A
KawaMiel.Oryg.500g        A
                      1 x39.99 39.99 A
OPUST                          -10.00 A
                                29.99
--------------------------------------
OPUSTY LACZNIE                 -23.72
SPRZEDAZ OPODATKOWANA A         30.78
SPRZEDAZ OPODATKOWANA C        122.15
PTU A 23%                        5.76
PTU C 5%                         5.82
SUMA PTU                        11.58
SUMA PLN                      152.93
ROZLICZENIE PLATNOSCI
BON - zwrot opak                 5.50 PLN
BON - zwrot opak                11.50 PLN
KARTA VISA 0711                135.93 PLN
00203 Wkasa 15 Kasjer nr 18 2026-05-27 21:37
`;

function parseReceipt(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const receipt = {
    store: 'Biedronka',
    nip: '',
    address: '',
    date: '',
    time: '',
    items: [],
    total: 0,
    totalDiscounts: 0
  };

  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Parse NIP
    if (line.includes('NIP')) {
      const nipMatch = line.match(/NIP\s*(\d+)/i);
      if (nipMatch) receipt.nip = nipMatch[1];
      continue;
    }

    // 2. Parse Address (usually Biedronka address is in the first few lines)
    if (line.includes('BIAŁYSTOK') || line.includes('WYSZYŃSKIEGO')) {
      receipt.address = line;
      continue;
    }

    // Detect if detail or discount line to avoid matching as item name
    const isDetail = /^\d+(\.\d+)?\s*x/i.test(line);
    const isDiscount = /^OPUST/i.test(line);

    // 3. Parse Items & Quantities/Prices
    // Pattern: Item name followed by a tax code A-D (e.g. "PoduszkiNugVit350g        C")
    const itemHeaderMatch = line.match(/^(.+)\s+([A-D])$/);
    if (itemHeaderMatch && !isDetail && !isDiscount && !line.includes('SUMA') && !line.includes('SPRZEDAZ') && !line.includes('PTU') && !line.includes('KARTA') && !line.includes('BON')) {
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

    // Pattern: Quantity x UnitPrice Subtotal TaxCategory (e.g. "3 x3.99 11.97 C" or "1.110 x4.99 5.54 C")
    const itemDetailsMatch = line.match(/^([\d.]+)\s+x([\d.]+)\s+([\d.]+)\s+([A-D])$/);
    if (itemDetailsMatch && currentItem) {
      currentItem.quantity = parseFloat(itemDetailsMatch[1]);
      currentItem.unitPrice = parseFloat(itemDetailsMatch[2]);
      currentItem.subtotalPrice = parseFloat(itemDetailsMatch[3]);
      currentItem.finalPrice = currentItem.subtotalPrice; // default before discount
      continue;
    }

    // Pattern: OPUST -3.99 C
    const discountMatch = line.match(/^OPUST\s+-?([\d.]+)\s+([A-D])$/i);
    if (discountMatch && currentItem) {
      const discountVal = parseFloat(discountMatch[1]);
      currentItem.discount = discountVal;
      currentItem.finalPrice = Math.round((currentItem.subtotalPrice - discountVal) * 100) / 100;
      continue;
    }

    // 4. Parse Total PLN
    if (line.includes('SUMA PLN')) {
      const totalMatch = line.match(/SUMA\s+PLN\s+([\d.,]+)/i);
      if (totalMatch) {
        receipt.total = parseFloat(totalMatch[1].replace(',', '.'));
      }
      continue;
    }

    // 5. Parse total discounts
    if (line.includes('OPUSTY LACZNIE')) {
      const discountTotalMatch = line.match(/OPUSTY\s+LACZNIE\s+-?([\d.,]+)/i);
      if (discountTotalMatch) {
        receipt.totalDiscounts = parseFloat(discountTotalMatch[1].replace(',', '.'));
      }
      continue;
    }

    // 6. Parse Date & Time (e.g. "2026-05-27 21:37")
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    if (dateMatch) {
      receipt.date = dateMatch[1];
      receipt.time = dateMatch[2];
      continue;
    }
  }

  return receipt;
}

const parsedResult = parseReceipt(rawReceiptText);
console.log('=== STRUCTURED RECEIPT JSON RESULT ===');
console.log(JSON.stringify(parsedResult, null, 2));
