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

  // Delete any market that is NOT BİM to satisfy user's request for only BİM
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
  return `https://www.google.com/url?q=${encodeURIComponent(targetUrl)}`;
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
        
        // 1. Headerdaki "Ürünler" menüsünden sadece "İNDİRİM" sütunundaki anahtarları topla
        let indirimColIndex = -1;
        $home('.aktuelsubmenu table tr').first().find('td, th').each((i, el) => {
          const text = $home(el).text().toUpperCase();
          if (text.includes('İNDİRİM') || text.includes('INDIRIM')) {
            indirimColIndex = i;
          }
        });

        // Eğer ilk satırda bulamazsak genel arama yap
        if (indirimColIndex === -1) {
          indirimColIndex = 1; // Fallback to 2nd column
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
              
              // Helper to parse Turkish price format
              const parsePrice = (text: string) => {
                if (!text) return null;
                // Replace comma with dot and remove all non-digits/non-dots
                const normalized = text.replace(',', '.').replace(/[^\d.]/g, '');
                const parts = normalized.split('.');
                if (parts.length > 2) {
                  // Had multiple dots (thousand separators). Combine all but last.
                  const decimalPart = parts.pop();
                  const wholePart = parts.join('');
                  return parseFloat(`${wholePart}.${decimalPart}`);
                }
                const val = parseFloat(normalized);
                return isNaN(val) ? null : val;
              };

              // BİM main price is split into quantify and number tags
              const priceWholeRaw = $(el).find('.gButton.triangle .text.quantify').text().trim().replace(/[^\d]/g, '');
              const priceDecimalRaw = $(el).find('.gButton.triangle .kusurArea .number').text().trim().replace(/[^\d]/g, '');
              const price = priceWholeRaw ? parseFloat(`${priceWholeRaw}.${priceDecimalRaw || '00'}`) : null;

              // Old price is usually a single string
              const oldPriceText = $(el).find('.CountButton.strikethrough .text.quantify').text().trim();
              const oldPrice = parsePrice(oldPriceText);

              const discountText = $(el).find('.DiscountButton').text().trim().replace('%', '').trim();

              if (price === null) continue;

              const discountRate = discountText ? parseInt(discountText) : (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

              // Lazy loaded images use xsrc
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
            // Anti-throttling delay (500ms - 1500ms arası rastgele)
            const randomDelay = Math.floor(Math.random() * 1000) + 500;
            await new Promise(resolve => setTimeout(resolve, randomDelay));
          } catch (err: any) {
            console.error(`- ${key} anahtarında hata oluştu:`, err.message);
          }
        }

        // Son aşama: Bu tarama sırasında en az 5 ürün güncellendiyse (başarılıysa), eski ürünleri sil
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
