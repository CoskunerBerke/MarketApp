import express from 'express';
import Product from '../models/Product';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { marketId, categoryId, search } = req.query;
    
    const query: any = {};
    if (marketId) query.marketId = marketId;
    if (categoryId) query.categoryId = categoryId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).populate('marketId', 'name logoUrl');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

export default router;
