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

// Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/markets', marketRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/categories', categoryRoutes);

// Health check for keep-alive pings
app.get('/api/system/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Manual/External scrape trigger with security check
app.post('/api/scrape/bim', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
  }

  try {
    console.log('External trigger: Starting BİM scrape...');
    scrapeSpecificMarket('BİM'); // Run in background
    res.json({ message: 'BİM tarama işlemi arka planda başlatıldı.' });
  } catch (error) {
    res.status(500).json({ message: 'Tarama başlatılırken bir hata oluştu.' });
  }
});

app.get('/', (req, res) => {
  res.send('Market App API is running...');
});

export default app;
