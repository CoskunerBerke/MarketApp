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
    const marketName = market.toUpperCase();
    console.log(`External trigger: Starting ${marketName} scrape...`);
    scrapeSpecificMarket(marketName);
    res.json({ message: `${marketName} tarama işlemi arka planda başlatıldı.` });
  } catch (error) {
    res.status(500).json({ message: 'Tarama başlatılırken bir hata oluştu.' });
  }
});

app.get('/', (req, res) => {
  res.send('Market App API is running...');
});

export default app;
