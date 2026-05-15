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
          'Referer': 'https://www.bim.com.tr/',
        },
        timeout: 25000
      });
      return response.data;
    } catch (err) {
      console.log(`  [${label}] Failed: ${err.message}`);
    }
  }
  return null;
}

async function scrapeAndPushBim() {
  console.log('=== BİM Scraper Started ===\n');
  console.log('Step 1: Fetching date keys from bim.com.tr...');
  
  const homeHtml = await fetchWithFallback('https://www.bim.com.tr/');
  if (!homeHtml) {
    console.error('CRITICAL: Cannot access bim.com.tr at all!');
    process.exit(1);
  }

  const $home = cheerio.load(homeHtml);
  const dateKeys = [];
  
  let indirimColIndex = -1;
  $home('.aktuelsubmenu table tr').first().find('td, th').each((i, el) => {
    const text = $home(el).text().toUpperCase();
    if (text.includes('İNDİRİM') || text.includes('INDIRIM')) {
      indirimColIndex = i;
    }
  });
  if (indirimColIndex === -1) indirimColIndex = 1;

  $home('.aktuelsubmenu table tr').each((_, tr) => {
    const td = $home(tr).find('td').eq(indirimColIndex);
    const links = td.find('a[href*="Bim_AktuelTarihKey="]');
    links.each((_, el) => {
      const href = $home(el).attr('href');
      const match = href?.match(/Bim_AktuelTarihKey=(\d+)/);
      if (match && !dateKeys.includes(match[1])) {
        dateKeys.push(match[1]);
      }
    });
  });

  console.log(`Found ${dateKeys.length} date keys: ${dateKeys.join(', ')}`);
  
  if (dateKeys.length === 0) {
    console.error('CRITICAL: No date keys found! BİM page structure may have changed.');
    process.exit(1);
  }

  console.log('\nStep 2: Scraping products...');
  const allProducts = [];

  for (const key of dateKeys) {
    const url = `https://www.bim.com.tr/?Bim_AktuelTarihKey=${key}`;
    console.log(`\nFetching key ${key}...`);
    
    const html = await fetchWithFallback(url);
    if (!html) {
      console.log(`  Key ${key}: All methods failed, skipping`);
      continue;
    }

    const $ = cheerio.load(html);
    const productElements = $('.product').toArray();
    console.log(`  Found ${productElements.length} items`);

    for (const el of productElements) {
      if ($(el).hasClass('justImage')) continue;

      const subTitle = $(el).find('.subTitle').text().trim();
      const title = $(el).find('.title').text().trim();
      const details = $(el).find('.gramajadet').text().trim();
      const fullName = `${subTitle} ${title} ${details}`.trim();

      const getBimPrice = (selector) => {
        const $container = $(el).find(selector);
        if ($container.length === 0) return null;
        const wholeText = $container.find('.text.quantify').text().trim();
        const decimalText = $container.find('.kusurArea .number').text().trim();
        if (decimalText) {
          const w = wholeText.replace(/[^\d]/g, '');
          const d = decimalText.replace(/[^\d]/g, '');
          return parseFloat(`${w}.${d}`);
        } else {
          const normalized = wholeText.replace(',', '.').replace(/[^\d.]/g, '');
          return parseFloat(normalized);
        }
      };

      const price = getBimPrice('.gButton.triangle');
      const oldPrice = getBimPrice('.CountButton.strikethrough');
      const discountText = $(el).find('.DiscountButton').text().trim().replace('%', '').trim();
      const imgPath = $(el).find('.image img').attr('xsrc') || $(el).find('.image img').attr('src') || $(el).find('img').attr('xsrc') || $(el).find('img').attr('src');

      if (!fullName || !price || !imgPath) continue;

      const discountRate = discountText ? parseInt(discountText) : (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

      allProducts.push({
        name: fullName,
        price,
        oldPrice: oldPrice || price,
        discountRate,
        imageUrl: imgPath.startsWith('http') ? imgPath : 'https://www.bim.com.tr' + imgPath,
        sourceUrl: url,
      });
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n========================================`);
  console.log(`Total BİM products: ${allProducts.length}`);

  if (allProducts.length === 0) {
    console.error('CRITICAL: 0 products found! BİM scraping completely failed.');
    process.exit(1);
  }

  console.log('Pushing to API...');
  const result = await axios.post(API_URL, {
    products: allProducts,
    marketName: 'BİM'
  }, { timeout: 120000 });

  console.log('Done:', result.data.message);
}

scrapeAndPushBim().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
