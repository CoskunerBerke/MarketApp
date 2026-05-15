const axios = require('axios');
const cheerio = require('cheerio');

const API_URL = 'https://market-backend-oozv.onrender.com/api/products/bulk';

async function scrapeAndPushBim() {
  console.log('Fetching BİM date keys...');
  try {
    const homeRes = await axios.get('https://www.bim.com.tr/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' }
    });
    const $home = cheerio.load(homeRes.data);
    const dateKeys = [];
    
    // Find Indirim columns
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
    
    const allProducts = [];
    for (const key of dateKeys) {
      console.log(`Fetching products for key ${key}...`);
      const url = `https://www.bim.com.tr/?Bim_AktuelTarihKey=${key}`;
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Referer': 'https://www.bim.com.tr/'
        }
      });
      const $ = cheerio.load(response.data);
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
        const imgPath = $(el).find('.image img').attr('xsrc') || $(el).find('.image img').attr('src');

        if (!fullName || !price || !imgPath) continue;

        allProducts.push({
          name: fullName,
          price,
          oldPrice: oldPrice || price,
          imageUrl: imgPath.startsWith('http') ? imgPath : 'https://www.bim.com.tr' + imgPath,
          sourceUrl: url,
        });
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nTotal BİM products: ${allProducts.length}`);
    if (allProducts.length > 0) {
      console.log('Pushing to API...');
      const result = await axios.post(API_URL, {
        products: allProducts,
        marketName: 'BİM'
      }, { timeout: 60000 });
      console.log('Done:', result.data.message);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

scrapeAndPushBim();
