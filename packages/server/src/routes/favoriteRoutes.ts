import express from 'express';
import Favorite from '../models/Favorite';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, async (req: any, res) => {
    try {
      const favorites = await Favorite.find({ user: req.user._id }).populate({
        path: 'product',
        populate: { path: 'marketId', select: 'name logoUrl' }
      });
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  })
  .post(protect, async (req: any, res) => {
    try {
      const { productId } = req.body;
      const alreadyFavorited = await Favorite.findOne({ user: req.user._id, product: productId });
      
      if (alreadyFavorited) {
        await Favorite.findByIdAndDelete(alreadyFavorited._id);
        return res.json({ message: 'Removed from favorites', action: 'removed' });
      } else {
        const favorite = await Favorite.create({ user: req.user._id, product: productId });
        return res.status(201).json({ message: 'Added to favorites', action: 'added', favorite });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

export default router;
