import express, { Express } from 'express';
import cors from 'cors';
import marketRoutes from './routes/marketRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import categoryRoutes from './routes/categoryRoutes';
import { scrapeA101 } from './services/scraperService';

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

app.post('/api/scrape/a101', async (req, res) => {
  try {
    scrapeA101();
    res.json({ message: 'A101 scraping job started' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start scraping job' });
  }
});

app.get('/', (req, res) => {
  res.send('Market App API is running...');
});

export default app;
