import express from 'express';
import Market from '../models/Market';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const markets = await Market.find({ isActive: true });
    res.json(markets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const market = new Market(req.body);
    const createdMarket = await market.save();
    res.status(201).json(createdMarket);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

export default router;
