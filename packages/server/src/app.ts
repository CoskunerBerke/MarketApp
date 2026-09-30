import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import marketRoutes from './routes/marketRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import categoryRoutes from './routes/categoryRoutes';
import { scrapeSpecificMarket } from './services/scraperService';
import { protect, admin, scraperApiKeyOrAdmin } from './middleware/authMiddleware';
import { validateBody, bulkProductSchema } from './middleware/validationMiddleware';
import { auditLogAction } from './middleware/auditLogger';

const app: Express = express();

// Behind a reverse proxy (e.g. Render) set TRUST_PROXY to the number of proxy hops (usually 1),
// otherwise every request appears to come from the proxy and all clients share one rate-limit bucket.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true' ? true : trustProxy);
}

// 1. Helmet for Security Headers
app.use(helmet());

// 2. CORS configuration with Origin Whitelist
const whitelist = [
  process.env.CLIENT_ORIGIN,
  process.env.ADMIN_ORIGIN
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
    
    // Disallowed origins get no CORS headers (the browser blocks the response)
    // instead of an error that would turn into a 500 with a stack trace.
    callback(null, Boolean(!origin || whitelist.includes(origin) || (isDevelopment && isLocalhost)));
  },
  credentials: true
};
app.use(cors(corsOptions));

// 3. Request Body Size Limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: { message: 'Çok fazla istek gönderildi, lütfen biraz bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/forgot attempts per 15 minutes
  message: { message: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 reset-code attempts per 15 minutes
  message: { message: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const scrapeBulkLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 scrape/bulk requests per minute
  message: { message: 'Kazıma/toplu yükleme sınırı aşıldı, lütfen biraz bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply Global Limiter
app.use(globalLimiter);

// Console Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route-specific Limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', loginLimiter);
app.use('/api/auth/reset-password', resetPasswordLimiter);

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api/system/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Scrape Route - Protected by Scraper API Key or Admin JWT
// Only BİM and ŞOK have a server-side scraper; Migros is updated by scripts/scrape-migros.js (GitHub Actions).
const serverScrapers: Record<string, string> = { 'bim': 'BİM', 'sok': 'ŞOK' };

app.post('/api/scrape/:market', scrapeBulkLimiter, scraperApiKeyOrAdmin, async (req, res) => {
  const market = req.params.market as string;
  const marketName = serverScrapers[market.toLowerCase()];

  if (!marketName) {
    return res.status(400).json({
      message: 'Bu market için sunucu tarafında tarama yok. Migros verisi zamanlanmış GitHub Actions betiğiyle güncellenir.',
    });
  }

  try {
    console.log(`External trigger: Starting ${marketName} scrape...`);
    
    auditLogAction(req, `Scrape Triggered for ${marketName}`, 'success');
    
    scrapeSpecificMarket(marketName);
    res.json({ message: `${marketName} tarama işlemi arka planda başlatıldı.` });
  } catch (error: any) {
    auditLogAction(req, `Scrape Trigger Failed for ${market}`, 'failure', error.message);
    res.status(500).json({ message: 'Tarama başlatılırken bir hata oluştu.' });
  }
});

// Bulk Products Route - Protected by Scraper API Key or Admin JWT, with schema validation
app.post('/api/products/bulk', scrapeBulkLimiter, scraperApiKeyOrAdmin, validateBody(bulkProductSchema), async (req, res) => {
  try {
    const { products, marketName } = req.body;
    
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
    
    auditLogAction(req, `Bulk Products Uploaded: ${count} products for ${marketName}`, 'success');
    res.json({ message: `${count} products saved for ${marketName}` });
  } catch (err: any) {
    auditLogAction(req, `Bulk Products Upload Failed for ${req.body.marketName}`, 'failure', err.message);
    res.status(500).json({ message: 'Toplu ürün yükleme başarısız.' });
  }
});

// Debug Route - Admin Only
app.get('/api/debug/sok', protect, admin, async (req, res) => {
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
    
    auditLogAction(req, 'Debug Sok Route Accessed', 'success');
    
    res.json({ 
      htmlSize: response.data.length, 
      status: response.status,
      productCount: wrappers.length,
      sampleProducts: products.slice(0, 3),
      bodyPreview: $('body').text().trim().substring(0, 200)
    });
  } catch (err: any) {
    auditLogAction(req, 'Debug Sok Route Failed', 'failure', err.message);
    res.json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Market App API is running...');
});

// Final error handler: JSON response without stack traces or internal messages
// (e.g. malformed JSON bodies, payloads over the size limit).
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) {
    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err?.message || err);
  }
  res.status(status).json({ message: status === 500 ? 'Sunucu hatası.' : 'Geçersiz istek.' });
});

export default app;
