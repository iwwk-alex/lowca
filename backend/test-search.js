const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testSearch(query) {
  const url = 'https://blix.pl/szukaj/';
  console.log(`Sending POST search request to ${url} with query "${query}"`);
  
  try {
    const params = new URLSearchParams();
    params.append('szukaj', query);

    const response = await axios.post(url, params.toString(), {
      headers: { 
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const $ = cheerio.load(response.data);
    console.log('Page title:', $('title').text().trim());
    
    console.log('=== PRODUCTS LIST ITEMS ===');
    $('.products ul li').each((i, el) => {
      console.log(`Li ${i} text: ${$(el).text().trim().substring(0, 150).replace(/\s+/g, ' ')}`);
      if (i === 0) {
        console.log(`  HTML of Li 0: ${$(el).html().substring(0, 1000).replace(/\s+/g, ' ')}`);
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

testSearch('mleko');
