import express, { Express } from 'express';
import cors from 'cors';
import marketRoutes from './routes/marketRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import categoryRoutes from './routes/categoryRoutes';
import { scrapeSpecificMarket } from './services/scraperService';

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/markets', marketRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api/system/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/scrape/:market', async (req, res) => {
  const { market } = req.params;
  
  // Temporarily removing strict API key check for Admin Panel usage
  // if (process.env.SCRAPER_API_KEY && apiKey !== process.env.SCRAPER_API_KEY) { ... }

  try {
    const marketMap: Record<string, string> = { 'bim': 'BİM', 'sok': 'ŞOK', 'migros': 'Migros' };
    const marketName = marketMap[market.toLowerCase()] || market.toUpperCase();
    console.log(`External trigger: Starting ${marketName} scrape...`);
    scrapeSpecificMarket(marketName);
    res.json({ message: `${marketName} tarama işlemi arka planda başlatıldı.` });
  } catch (error) {
    res.status(500).json({ message: 'Tarama başlatılırken bir hata oluştu.' });
  }
});

app.post('/api/products/bulk', async (req, res) => {
  try {
    const { products, marketName } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'products array required' });
    }
    
    const Market = (await import('./models/Market')).default;
    const Product = (await import('./models/Product')).default;
    const Category = (await import('./models/Category')).default;
    
    let market = await Market.findOne({ name: marketName });
    if (!market) {
      market = await Market.create({ name: marketName, logoUrl: '' });
    }
    let gida = await Category.findOne({ slug: 'gida' });
    
    const scrapeStartTime = new Date();
    let count = 0;
    
    for (const p of products) {
      await Product.findOneAndUpdate(
        { name: p.name, marketId: market._id },
        { $set: { ...p, marketId: market._id, categoryId: gida?._id, isScraped: true, updatedAt: new Date() } },
        { upsert: true }
      );
      count++;
    }
    
    if (count >= 5) {
      await Product.deleteMany({ marketId: market._id, updatedAt: { $lt: scrapeStartTime } });
    }
    
    res.json({ message: `${count} products saved for ${marketName}` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/sok', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const cheerio = await import('cheerio');
    const response = await axios.get('https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 20000
    });
    const $ = cheerio.load(response.data);
    const wrappers = $('div[class*="productCardWrapper"]').toArray();
    const products = wrappers.map(el => ({
      title: $(el).find('[class*="module_title"]').text().trim(),
      price: $(el).find('[class*="module_price"]').first().text().trim(),
    }));
    res.json({ 
      htmlSize: response.data.length, 
      status: response.status,
      productCount: wrappers.length,
      sampleProducts: products.slice(0, 3),
      bodyPreview: $('body').text().trim().substring(0, 200)
    });
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Market App API is running...');
});

export default app;
