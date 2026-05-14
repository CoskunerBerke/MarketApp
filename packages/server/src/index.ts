import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cron from 'node-cron';
import { scrapeSpecificMarket } from './services/scraperService';

dotenv.config();

connectDB();

cron.schedule('30 21 * * *', () => { scrapeSpecificMarket('BİM'); scrapeSpecificMarket('ŞOK'); });
cron.schedule('30 5 * * *', () => { scrapeSpecificMarket('BİM'); scrapeSpecificMarket('ŞOK'); });
cron.schedule('30 10 * * *', () => { scrapeSpecificMarket('BİM'); scrapeSpecificMarket('ŞOK'); });
cron.schedule('30 16 * * *', () => { scrapeSpecificMarket('BİM'); scrapeSpecificMarket('ŞOK'); });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
