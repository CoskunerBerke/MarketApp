import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cron from 'node-cron';
import { scrapeSpecificMarket } from './services/scraperService';

dotenv.config();

// Connect to Database
connectDB();

// BİM Güncelleme Saatleri (Türkiye saati ile 00:30, 08:30, 13:30, 19:30)
// Render sunucuları genellikle UTC kullandığı için saatleri 3 saat geri çekiyoruz:
cron.schedule('30 21 * * *', () => scrapeSpecificMarket('BİM')); // TRT 00:30
cron.schedule('30 5 * * *', () => scrapeSpecificMarket('BİM'));  // TRT 08:30
cron.schedule('30 10 * * *', () => scrapeSpecificMarket('BİM')); // TRT 13:30
cron.schedule('30 16 * * *', () => scrapeSpecificMarket('BİM')); // TRT 19:30

// Diğer marketler şimdilik devre dışı (Kullanıcı isteği üzerine sadece BİM odaklı)
// cron.schedule('0 1 * * *', () => scrapeSpecificMarket('A101'));
// cron.schedule('30 2 * * *', () => scrapeSpecificMarket('ŞOK'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
