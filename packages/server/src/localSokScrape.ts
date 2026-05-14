import axios from 'axios';
import * as cheerio from 'cheerio';

const API_URL = 'https://market-backend-oozv.onrender.com/api/products/bulk';

async function scrapeAndPush() {
  const pages = [1, 2, 3, 4];
  const allProducts: any[] = [];

  for (const page of pages) {
    const targetUrl = `https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53?page=${page}`;
    console.log(`Fetching page ${page}...`);

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        },
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      const productWrappers = $('div[class*="productCardWrapper"]').toArray();
      console.log(`  Page ${page}: ${productWrappers.length} products`);

      for (const el of productWrappers) {
        const name = $(el).find('[class*="module_title"]').text().trim();
        const priceText = $(el).find('[class*="module_price"]').first().text().trim();
        const imageUrl = $(el).find('img').attr('src');
        const promotionText = $(el).find('[class*="module_promotionBadgeContainer"]').text().trim();

        if (!name || !priceText) continue;

        const price = parseFloat(priceText.replace(',', '.').replace(/[^\d.]/g, ''));
        if (isNaN(price)) continue;

        let promotionPrice: number | undefined = undefined;
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
          sourceUrl: `https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53?page=${page}`,
        });
      }
    } catch (err: any) {
      console.error(`  Page ${page} error:`, err.message);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nTotal products scraped: ${allProducts.length}`);
  console.log('Pushing to production API...');

  try {
    const result = await axios.post(API_URL, {
      products: allProducts,
      marketName: 'ŞOK'
    }, { timeout: 60000 });
    console.log('✅', result.data.message);
  } catch (err: any) {
    console.error('❌ Push failed:', err.response?.data || err.message);
  }
}

scrapeAndPush();
