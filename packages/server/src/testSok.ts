import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSokScrape() {
  const targetUrl = 'https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53';
  
  const response = await axios.get(targetUrl, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    timeout: 20000
  });

  const $ = cheerio.load(response.data);
  const productWrappers = $('div[class*="productCardWrapper"]').toArray();
  console.log(`Total wrappers: ${productWrappers.length}`);
  
  for (let i = 0; i < Math.min(5, productWrappers.length); i++) {
    const el = productWrappers[i];
    const title = $(el).find('[class*="module_title"]').text().trim();
    const priceText = $(el).find('[class*="module_price"]').first().text().trim();
    const imageUrl = $(el).find('img').attr('src');
    const promotionText = $(el).find('[class*="module_promotionBadgeContainer"]').text().trim();
    const sourceUrlSuffix = $(el).find('a').attr('href');
    
    console.log(`\n--- Product ${i+1} ---`);
    console.log(`Title: "${title}"`);
    console.log(`Price: "${priceText}"`);
    console.log(`Image: "${imageUrl}"`);
    console.log(`Promo: "${promotionText}"`);
    console.log(`Link: "${sourceUrlSuffix}"`);
    
    // Try parsing price
    if (priceText) {
      const cleanPrice = priceText.split('<!--')[0].replace(',', '.').replace(/[^\d.]/g, '');
      console.log(`Parsed price: ${parseFloat(cleanPrice)}`);
    }
  }
}

testSokScrape();
