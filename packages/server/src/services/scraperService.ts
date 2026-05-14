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

  await Market.deleteMany({ name: { $ne: 'BİM' } });

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
  return targetUrl;
};

let isScraping = false;

export const scrapeSpecificMarket = async (marketName: string) => {
  if (isScraping) {
    console.log(`${marketName} scraping already in progress, skipping...`);
    return;
  }

  try {
    isScraping = true;
    await initMarketsAndCategories();
    let market = await Market.findOne({ name: marketName });
    if (!market) return;

    const scrapeStartTime = new Date();
    let gida = await Category.findOne({ slug: 'gida' });

    if (marketName === 'BİM') {
      try {
        const homeRes = await axios.get('https://www.bim.com.tr/', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
        });
        const $home = cheerio.load(homeRes.data);
        const dateKeys: string[] = [];
        
        let indirimColIndex = -1;
        $home('.aktuelsubmenu table tr').first().find('td, th').each((i, el) => {
          const text = $home(el).text().toUpperCase();
          if (text.includes('İNDİRİM') || text.includes('INDIRIM')) {
            indirimColIndex = i;
          }
        });

        if (indirimColIndex === -1) {
          indirimColIndex = 1;
        }

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

        console.log(`BİM (Sadece İndirim): ${dateKeys.length} tarih anahtarı bulundu. İşlem başlıyor...`);

        if (dateKeys.length === 0) {
           console.log('BİM İndirim anahtarları bulunamadı.');
           isScraping = false;
           return; 
        }

        let totalSuccessCount = 0;
        for (const key of dateKeys) {
          try {
            const url = `https://www.bim.com.tr/?Bim_AktuelTarihKey=${key}`;
            const response = await axios.get(url, {
              headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.bim.com.tr/',
                'Cache-Control': 'no-cache'
              },
              timeout: 15000
            });
            const $ = cheerio.load(response.data);
            
            const products = $('.product').toArray();
            console.log(`- ${key}: ${products.length} ürün bulundu.`);
            
            for (const el of products) {
              if ($(el).hasClass('justImage')) continue;

              const subTitle = $(el).find('.subTitle').text().trim();
              const title = $(el).find('.title').text().trim();
              const details = $(el).find('.gramajadet').text().trim();
              const fullName = `${subTitle} ${title} ${details}`.trim();
              
              const getBimPrice = (selector: string) => {
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
                  const parts = normalized.split('.');
                  if (parts.length > 2) {
                    const d = parts.pop();
                    const w = parts.join('');
                    return parseFloat(`${w}.${d}`);
                  }
                  const val = parseFloat(normalized);
                  return isNaN(val) ? null : val;
                }
              };

              const price = getBimPrice('.gButton.triangle');
              const oldPrice = getBimPrice('.CountButton.strikethrough');
              
              const discountText = $(el).find('.DiscountButton').text().trim().replace('%', '').trim();

              if (price === null) continue;

              const discountRate = discountText ? parseInt(discountText) : (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

              const imgPath = $(el).find('.image img').attr('xsrc') || $(el).find('.image img').attr('src') || $(el).find('img').attr('xsrc') || $(el).find('img').attr('src');
              
              if (!fullName || isNaN(price) || !imgPath) continue;

              const imageUrl = imgPath.startsWith('http') ? imgPath : 'https://www.bim.com.tr' + imgPath;
              const originalSourceUrl = $(el).find('a').attr('href');
              const fullSourceUrl = originalSourceUrl?.startsWith('http') ? originalSourceUrl : 'https://www.bim.com.tr' + (originalSourceUrl || '');

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
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              );
              totalSuccessCount++;
            }
            const randomDelay = Math.floor(Math.random() * 1000) + 500;
            await new Promise(resolve => setTimeout(resolve, randomDelay));
          } catch (err: any) {
            console.error(`- ${key} anahtarında hata oluştu:`, err.message);
          }
        }

        if (totalSuccessCount >= 5) {
          const deletedResult = await Product.deleteMany({
            marketId: market._id,
            updatedAt: { $lt: scrapeStartTime }
          });
          console.log(`BİM Tarama Tamamlandı. ${deletedResult.deletedCount} eski ürün silindi.`);
        } else {
          console.log(`BİM Tarama yetersiz ürün buldu (${totalSuccessCount}), silme işlemi atlandı.`);
        }

      } catch (err) { console.error('BİM ana sayfa hatası:', err); }
    }
  } catch (error) { console.error(`Error in ${marketName}:`, error); }
  finally {
    isScraping = false;
  }
};

export const triggerBimScrape = async () => {
  await scrapeSpecificMarket('BİM');
};
