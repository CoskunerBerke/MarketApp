const axios = require('axios');
const cheerio = require('cheerio');

const API_URL = 'https://market-backend-oozv.onrender.com/api/products/bulk';

const PROXIES = [
  (url) => url,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url) {
  for (let i = 0; i < PROXIES.length; i++) {
    const fetchUrl = PROXIES[i](url);
    const label = i === 0 ? 'Direct' : `Proxy ${i}`;
    try {
      console.log(`  [${label}] Trying...`);
      const response = await axios.get(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 25000
      });

      const $ = cheerio.load(response.data);
      const products = $('div[class*="productCardWrapper"]').toArray();

      if (products.length > 0) {
        console.log(`  [${label}] SUCCESS - ${products.length} products found`);
        return { $, products };
      }
      console.log(`  [${label}] Page loaded but 0 products (likely blocked)`);
    } catch (err) {
      console.log(`  [${label}] Failed: ${err.message}`);
    }
  }
  return null;
}

async function scrapeAndPush() {
  const pages = [1, 2, 3, 4];
  const allProducts = [];

  for (const page of pages) {
    const targetUrl = `https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53?page=${page}`;
    console.log(`\nFetching page ${page}...`);

    const result = await fetchWithFallback(targetUrl);
    if (!result) {
      console.log(`  Page ${page}: All methods failed, skipping`);
      continue;
    }

    const { $, products: productWrappers } = result;

    for (const el of productWrappers) {
      let name = $(el).find('[class*="module_title"]').text().trim();
      if (!name) name = $(el).find('[class*="title"]').text().trim();

      let priceText = $(el).find('[class*="module_price"]').first().text().trim();
      if (!priceText) priceText = $(el).find('[class*="price"]').first().text().trim();

      const imageUrl = $(el).find('img').attr('src');
      const promotionText = $(el).find('[class*="promotionBadge"]').text().trim();

      if (!name || !priceText) continue;
      const price = parseFloat(priceText.replace(',', '.').replace(/[^\d.]/g, ''));
      if (isNaN(price)) continue;

      let promotionPrice = undefined;
      if (promotionText && promotionText.includes('üzeri')) {
        const parts = promotionText.split('üzeri');
        if (parts.length > 1) {
          const match = parts[1].match(/(\d+\.?\d*)/);
          if (match) promotionPrice = parseFloat(match[1]);
        }
      }

      allProducts.push({
        name, price, oldPrice: price, promotionPrice,
        promotionText: promotionText || undefined,
        imageUrl,
        sourceUrl: targetUrl,
      });
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  const seen = new Set();
  const uniqueProducts = allProducts.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`\n========================================`);
  console.log(`Total: ${allProducts.length}, Unique: ${uniqueProducts.length}`);

  if (uniqueProducts.length === 0) {
    console.error('CRITICAL: 0 products found! All scraping methods failed.');
    process.exit(1);
  }

  console.log('Pushing to API...');
  const result = await axios.post(API_URL, {
    products: uniqueProducts,
    marketName: 'ŞOK'
  }, { timeout: 120000 });

  console.log('Done:', result.data.message);
}

scrapeAndPush().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
