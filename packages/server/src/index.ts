import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cron from 'node-cron';
import { scrapeSpecificMarket } from './services/scraperService';

dotenv.config();

// Connect to Database
connectDB();

// Schedule scraping tasks
// BİM: 02:00 and 07:00
cron.schedule('0 2 * * *', () => scrapeSpecificMarket('BİM'));
cron.schedule('0 7 * * *', () => scrapeSpecificMarket('BİM'));

// A101: 01:00 and 06:00
cron.schedule('0 1 * * *', () => scrapeSpecificMarket('A101'));
cron.schedule('0 6 * * *', () => scrapeSpecificMarket('A101'));

// ŞOK: 02:30 and 07:30
cron.schedule('30 2 * * *', () => scrapeSpecificMarket('ŞOK'));
cron.schedule('30 7 * * *', () => scrapeSpecificMarket('ŞOK'));

// Migros: Every 2 hours
cron.schedule('0 */2 * * *', () => scrapeSpecificMarket('Migros'));

// Çağdaş: 09:00
cron.schedule('0 9 * * *', () => scrapeSpecificMarket('Çağdaş'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
