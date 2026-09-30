/**
 * Fills an EMPTY local database with fictional demo products so the web client
 * and admin panel can be tried (and screenshotted) without running the scrapers.
 *
 *   MONGODB_URI=mongodb://localhost:27017/market_demo pnpm --filter @market/server seed:demo
 *
 * It refuses to run with NODE_ENV=production or when products already exist.
 * Product names, prices and images are made up; images are inline SVG placeholders.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Market from '../models/Market';
import Product from '../models/Product';
import Category from '../models/Category';

dotenv.config();

type DemoProduct = { name: string; price: number; oldPrice: number; promotionText?: string; promotionPrice?: number };

const demoCatalog: Record<string, { color: string; products: DemoProduct[] }> = {
  'BİM': {
    color: '#e30613',
    products: [
      { name: 'Yarım Yağlı Süt 1 L', price: 32.5, oldPrice: 39.9 },
      { name: 'Tam Buğday Ekmeği 500 g', price: 17.9, oldPrice: 21.5 },
      { name: 'Beyaz Peynir 500 g', price: 119, oldPrice: 149 },
      { name: 'Süzme Bal 850 g', price: 289, oldPrice: 339 },
      { name: 'Filtre Kahve 500 g', price: 219, oldPrice: 259 },
      { name: 'Zeytinyağı 1 L', price: 349, oldPrice: 419 },
      { name: 'Çamaşır Deterjanı 4 kg', price: 189, oldPrice: 239 },
      { name: 'Kablosuz Kulaklık', price: 1299, oldPrice: 1599 },
    ],
  },
  'ŞOK': {
    color: '#ffd200',
    products: [
      { name: 'Yumurta 15\'li', price: 84.5, oldPrice: 84.5, promotionText: '50 TL üzeri 74.90 TL!', promotionPrice: 74.9 },
      { name: 'Makarna 500 g', price: 14.9, oldPrice: 14.9, promotionText: '50 TL üzeri 11.90 TL!', promotionPrice: 11.9 },
      { name: 'Domates Salçası 830 g', price: 64.9, oldPrice: 64.9 },
      { name: 'Siyah Çay 1 kg', price: 229, oldPrice: 229, promotionText: '50 TL üzeri 199.00 TL!', promotionPrice: 199 },
      { name: 'Ayçiçek Yağı 2 L', price: 139, oldPrice: 139 },
      { name: 'Bulaşık Deterjanı 1,5 L', price: 79.9, oldPrice: 79.9 },
    ],
  },
  'Migros': {
    color: '#ff7f00',
    products: [
      { name: 'Kaşar Peyniri 600 g', price: 199.9, oldPrice: 259.9 },
      { name: 'Granola 400 g', price: 89.5, oldPrice: 119.5 },
      { name: 'Portakal Suyu 1 L', price: 54.9, oldPrice: 69.9 },
      { name: 'Kakaolu Fındık Kreması 700 g', price: 169, oldPrice: 219 },
      { name: 'Tavuk Göğüs Fileto 1 kg', price: 239, oldPrice: 289 },
      { name: 'Kahve Makinesi', price: 2499, oldPrice: 3199 },
    ],
  },
};

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');

/** A simple SVG "product card" placeholder so the demo needs no external images. */
const placeholderImage = (name: string, color: string) => {
  const words = name.split(' ');
  const line1 = escapeXml(words.slice(0, 2).join(' '));
  const line2 = escapeXml(words.slice(2).join(' '));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="200" cy="112" r="54" fill="${color}" opacity="0.9"/>
<text x="200" y="128" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(name.charAt(0))}</text>
<text x="200" y="214" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a" text-anchor="middle">${line1}</text>
<text x="200" y="246" font-family="Arial, sans-serif" font-size="20" fill="#475569" text-anchor="middle">${line2}</text>
<text x="200" y="284" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">DEMO</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const seedDemo = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[DEMO SEED] Refusing to run with NODE_ENV=production.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/market_app';
  await mongoose.connect(uri);

  if ((await Product.countDocuments()) > 0) {
    console.error('[DEMO SEED] The database already contains products; use an empty database for demo data.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const gida = await Category.findOneAndUpdate(
    { slug: 'gida' },
    { $set: { name: 'Gıda', slug: 'gida' } },
    { upsert: true, returnDocument: 'after' }
  );

  let count = 0;
  for (const [marketName, { color, products }] of Object.entries(demoCatalog)) {
    const market = await Market.findOneAndUpdate(
      { name: marketName },
      { $set: { name: marketName, isActive: true } },
      { upsert: true, returnDocument: 'after' }
    );
    for (const p of products) {
      const discountRate = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
      await Product.create({
        ...p,
        discountRate,
        marketId: market!._id,
        categoryId: gida?._id,
        imageUrl: placeholderImage(p.name, color),
        sourceUrl: 'https://example.com/demo',
        isScraped: false,
      });
      count++;
    }
  }

  console.log(`[DEMO SEED] Created ${count} demo products in ${Object.keys(demoCatalog).length} markets.`);
  await mongoose.disconnect();
};

seedDemo().catch(async (err) => {
  console.error('[DEMO SEED] Failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
