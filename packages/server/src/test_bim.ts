import axios from 'axios';
import * as cheerio from 'cheerio';

async function testBim() {
  try {
    const response = await axios.get('https://www.bim.com.tr/Categories/100/aktuel-urunler.aspx', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(response.data);
    const items = $('.item');
    console.log(`Found ${items.length} items`);
    
    items.each((i, el) => {
      if (i > 5) return;
      const title = $(el).find('.title').text().trim();
      const subTitle = $(el).find('.subTitle').text().trim();
      const priceWhole = $(el).find('.gButton.triangle div').text().trim();
      const priceDecimal = $(el).find('.gButton.triangle span').text().trim();
      const img = $(el).find('img').attr('src');
      console.log(`- ${title} ${subTitle} | Price: ${priceWhole},${priceDecimal} | Img: ${img}`);
    });
  } catch (e) {
    console.error(e);
  }
}

testBim();
