import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, hasTestDb } from './helpers/db';
import app from '../src/app';
import Market from '../src/models/Market';
import Product from '../src/models/Product';

const API_KEY = 'test-scraper-key';

describe.skipIf(!hasTestDb)('products, bulk upload and favourites', () => {
  let marketId = '';

  beforeAll(async () => {
    await connectTestDb('marketapp_test_products');
    const market = await Market.create({ name: 'Demo Market' });
    marketId = market.id;
    await Product.create([
      { name: 'Demo Süt (1L)', price: 30, marketId },
      { name: "Demo Yumurta 10'lu", price: 55, marketId },
      { name: 'Demo Ekmek', price: 10, marketId },
    ]);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('treats the search text literally', async () => {
    const dot = await request(app).get('/api/products').query({ search: '.' });
    expect(dot.status).toBe(200);
    expect(dot.body).toHaveLength(0); // an unescaped "." would match every product

    const paren = await request(app).get('/api/products').query({ search: 'süt (1l' });
    expect(paren.status).toBe(200); // an unescaped "(" is an invalid regular expression
    expect(paren.body.map((p: any) => p.name)).toEqual(['Demo Süt (1L)']);
  });

  it('filters by market', async () => {
    const res = await request(app).get('/api/products').query({ marketId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].marketId.name).toBe('Demo Market');
  });

  it('upserts a bulk upload and removes products missing from a full scrape', async () => {
    const products = Array.from({ length: 5 }, (_, i) => ({
      name: `Demo Bulk Ürün ${i + 1}`,
      price: 10 + i,
      oldPrice: 20 + i,
      discountRate: 10,
      sourceUrl: 'https://example.com/demo',
    }));
    const res = await request(app)
      .post('/api/products/bulk')
      .set('x-api-key', API_KEY)
      .send({ marketName: 'Demo Bulk Market', products });
    expect(res.status).toBe(200);

    const bulkMarket = await Market.findOne({ name: 'Demo Bulk Market' });
    expect(await Product.countDocuments({ marketId: bulkMarket?._id })).toBe(5);

    await new Promise((r) => setTimeout(r, 20));
    const second = await request(app)
      .post('/api/products/bulk')
      .set('x-api-key', API_KEY)
      .send({ marketName: 'Demo Bulk Market', products: products.slice(0, 5).map((p) => ({ ...p, name: `${p.name} v2` })) });
    expect(second.status).toBe(200);
    const names = (await Product.find({ marketId: bulkMarket?._id }).lean()).map((p) => p.name).sort();
    expect(names).toEqual(products.map((p) => `${p.name} v2`).sort());
  });

  it('validates favourite ids and hides favourites whose product was removed', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ email: 'favorites.demo@example.com', password: 'demo-pass-123' });
    expect(register.status).toBe(201);
    const auth = { Authorization: `Bearer ${register.body.token}` };

    const invalid = await request(app).post('/api/favorites').set(auth).send({ productId: 'not-an-id' });
    expect(invalid.status).toBe(400);

    const [keep, remove] = await Product.find({ marketId }).sort({ name: 1 }).limit(2);
    await request(app).post('/api/favorites').set(auth).send({ productId: keep.id }).expect(200);
    const toggled = await request(app).post('/api/favorites').set(auth).send({ productId: remove.id });
    expect(toggled.body.favorites).toHaveLength(2);

    await Product.deleteOne({ _id: remove._id });

    const list = await request(app).get('/api/favorites').set(auth);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].product._id).toBe(keep.id);
  });
});
