import axios from 'axios';
import * as cheerio from 'cheerio';
import Product from '../models/Product';
import Market from '../models/Market';
import Category from '../models/Category';

const initMarketsAndCategories = async () => {
  const markets = [
    { name: 'BİM', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png' }
  ];

  for (const m of markets) {
    await Market.findOneAndUpdate({ name: m.name }, { $set: m }, { upsert: true });
  }

  const categories = [
    { name: 'Gıda', slug: 'gida' },
    { name: 'Temizlik', slug: 'temizlik' },
    { name: 'Kişisel Bakım', slug: 'kisisel-bakim' }
  ];

  for (const c of categories) {
    await Category.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true });
  }
};

const getSafeUrl = (targetUrl: string) => {
  return `https://www.google.com/url?q=${encodeURIComponent(targetUrl)}`;
};

export const scrapeSpecificMarket = async (marketName: string) => {
  try {
    await initMarketsAndCategories();
    let market = await Market.findOne({ name: marketName });
    if (!market) return;

    await Product.deleteMany({}); // Clear everything for a fresh BİM start as requested
    let gida = await Category.findOne({ slug: 'gida' });

    if (marketName === 'BİM') {
      try {
        const homeRes = await axios.get('https://www.bim.com.tr/', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
        });
        const $home = cheerio.load(homeRes.data);
        const dateKeys: string[] = [];
        
        // Find AktuelTarihKey values from the "İndirim" and "Aktüel" sections
        $home('a[href*="Bim_AktuelTarihKey="]').each((_, el) => {
          const href = $home(el).attr('href');
          const match = href?.match(/Bim_AktuelTarihKey=(\d+)/);
          if (match && !dateKeys.includes(match[1])) {
            dateKeys.push(match[1]);
          }
        });

        if (dateKeys.length === 0) dateKeys.push(''); // Fallback to main page

        for (const key of dateKeys) {
          const url = `https://www.bim.com.tr/${key ? `?Bim_AktuelTarihKey=${key}` : ''}`;
          const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
          });
          const $ = cheerio.load(response.data);
          
          $('.product').each(async (_, el) => {
            const subTitle = $(el).find('.subTitle').text().trim();
            const title = $(el).find('.title').text().trim();
            const details = $(el).find('.gramajadet').text().trim();
            const fullName = `${subTitle} ${title} ${details}`.trim();
            
            // Prices
            const oldPriceText = $(el).find('.CountButton.strikethrough .text.quantify').text().trim().replace(',', '.');
            const priceWhole = $(el).find('.gButton.triangle .text.quantify').text().trim().replace(',', '');
            const priceDecimal = $(el).find('.gButton.triangle .kusurArea .number').text().trim();
            const discountText = $(el).find('.DiscountButton').text().trim().replace('%', '').trim();

            const price = parseFloat(`${priceWhole}.${priceDecimal}`);
            const oldPrice = oldPriceText ? parseFloat(oldPriceText) : null;
            const discountRate = discountText ? parseInt(discountText) : (oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

            const imgPath = $(el).find('.image img').attr('src') || $(el).find('img').attr('src');
            if (!imgPath) return;
            const imageUrl = imgPath.startsWith('http') ? imgPath : 'https://www.bim.com.tr' + imgPath;
            
            const originalSourceUrl = $(el).find('a').attr('href');
            const fullSourceUrl = originalSourceUrl?.startsWith('http') ? originalSourceUrl : 'https://www.bim.com.tr' + (originalSourceUrl || '');

            if (fullName && price) {
              await Product.findOneAndUpdate(
                { name: fullName, marketId: market._id },
                { 
                  $set: {
                    name: fullName, 
                    marketId: market._id, 
                    price, 
                    oldPrice: oldPrice || price, 
                    discountRate,
                    imageUrl, 
                    sourceUrl: getSafeUrl(fullSourceUrl), 
                    isScraped: true, 
                    categoryId: gida?._id,
                    campaignStartDate: new Date(), 
                    campaignEndDate: new Date(Date.now() + 86400000 * 7)
                  }
                },
                { upsert: true }
              );
            }
          });
        }
        return;
      } catch (err) { console.error('BİM fail:', err); }
    }

    // Removed other markets to focus only on BİM
  } catch (error) { console.error(`Error in ${marketName}:`, error); }
};

export const scrapeA101 = async () => {
  await scrapeSpecificMarket('BİM');
};
