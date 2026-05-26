require('dotenv').config();
const axios = require('axios');

const scraperApiKey = process.env.SCRAPER_API_KEY;
if (!scraperApiKey) {
  throw new Error("CRITICAL: SCRAPER_API_KEY environment variable is missing!");
}

const API_URL = 'https://market-backend-oozv.onrender.com/api/products/bulk';
const MIGROS_API = 'https://www.migros.com.tr/rest/sanalmarket/products/search';
const MAX_PAGES = 15;
const MIN_DISCOUNT = 15; // Sadece %15 ve üzeri indirimli ürünler

async function fetchMigrosPage(page) {
  try {
    const response = await axios.get(MIGROS_API, {
      params: { q: 'indirim', page, asc: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Referer': 'https://www.migros.com.tr/',
      },
      timeout: 20000
    });
    return response.data.data;
  } catch (err) {
    console.error(`  Page ${page} error:`, err.message);
    return null;
  }
}

async function scrapeAndPush() {
  console.log('=== Migros Scraper Started ===\n');

  const allProducts = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    console.log(`Fetching page ${page + 1}/${MAX_PAGES}...`);
    const data = await fetchMigrosPage(page);

    if (!data || !data.storeProductInfos || data.storeProductInfos.length === 0) {
      console.log(`  Page ${page + 1}: No data, stopping.`);
      break;
    }

    const products = data.storeProductInfos;
    console.log(`  Page ${page + 1}: ${products.length} products`);

    for (const p of products) {
      if (!p.discountRate || p.discountRate < MIN_DISCOUNT) continue;
      if (!p.name || !p.shownPrice) continue;

      const price = p.shownPrice / 100;
      const oldPrice = p.regularPrice ? p.regularPrice / 100 : price;
      const imageUrl = p.images?.[0]?.urls?.PRODUCT_LIST || p.images?.[0]?.urls?.PRODUCT_DETAIL || '';
      const sourceUrl = `https://www.migros.com.tr/${p.prettyName}`;

      allProducts.push({
        name: p.name,
        price,
        oldPrice,
        discountRate: p.discountRate,
        imageUrl,
        sourceUrl,
      });
    }

    if (page >= data.pageCount - 1) {
      console.log('  Reached last page.');
      break;
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  // Deduplicate
  const seen = new Set();
  const uniqueProducts = allProducts.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`\n========================================`);
  console.log(`Total: ${allProducts.length}, Unique: ${uniqueProducts.length}`);

  if (uniqueProducts.length === 0) {
    console.error('CRITICAL: 0 Migros products found!');
    process.exit(1);
  }

  console.log('Pushing to API...');
  const result = await axios.post(API_URL, {
    products: uniqueProducts,
    marketName: 'Migros'
  }, { 
    timeout: 120000,
    headers: {
      'x-api-key': scraperApiKey
    }
  });

  console.log('Done:', result.data.message);
}

scrapeAndPush().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
