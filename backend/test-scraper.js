const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrapeStore(storeName, url) {
  console.log(`\n=== SCRAPING ${storeName.toUpperCase()} FROM BLIX ===`);
  const items = [];
  
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    const $ = cheerio.load(response.data);
    
    $('.product').each((i, el) => {
      // Limit to 10 products per store to keep it compact but representative
      if (items.length >= 10) return;
      
      const name = $(el).find('.product__name').text().trim();
      const priceStr = $(el).find('.product__price').text().trim();
      
      // Get image from data-src or src attribute
      let imgUrl = $(el).find('.product__img').attr('data-src') || $(el).find('.product__img').attr('src') || '';
      if (imgUrl && imgUrl.startsWith('/')) {
        imgUrl = `https://blix.pl${imgUrl}`;
      }
      
      // Parse Polish currency format, e.g. "14,99 zł" -> 14.99
      const parsedPrice = parseFloat(priceStr.replace('&nbsp;', ' ').replace(',', '.').replace(/[^0-9.]/g, ''));
      
      if (name && !isNaN(parsedPrice)) {
        items.push({
          id: `${storeName}-${i}`,
          store: storeName,
          name: name.replace(/\s+/g, ' '),
          price: parsedPrice,
          imgUrl,
          promo: 'Promocja gazetkowa'
        });
      }
    });
    
    console.log(`Successfully scraped ${storeName}. Found ${items.length} products.`);
    if (items.length > 0) {
      console.log('Sample item:', items[0]);
    }
  } catch (err) {
    console.error(`Error scraping ${storeName}: ${err.message}`);
  }
  return items;
}

async function runAll() {
  console.log('Starting Unified Scraper Connection...');
  
  const bData = await scrapeStore('biedronka', 'https://blix.pl/sklep/biedronka/');
  const lData = await scrapeStore('lidl', 'https://blix.pl/sklep/lidl/');
  const kData = await scrapeStore('kaufland', 'https://blix.pl/sklep/kaufland/');
  
  const allItems = [...bData, ...lData, ...kData];
  
  // Create output directories if they don't exist
  const publicDir = path.join(__dirname, '../frontend/public');
  if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const filePath = path.join(publicDir, 'scraped-data.json');
  fs.writeFileSync(filePath, JSON.stringify(allItems, null, 2));
  console.log(`\nSuccess! Saved ${allItems.length} total products to: ${filePath}`);
  console.log('Scraper Connection Test Finished.');
}

runAll();
