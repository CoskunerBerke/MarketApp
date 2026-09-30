import express from 'express';
import Favorite from '../models/Favorite';
import { protect } from '../middleware/authMiddleware';
import { validateBody, favoriteSchema } from '../middleware/validationMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, async (req: any, res) => {
    try {
      const favorites = await Favorite.find({ user: req.user._id }).populate({
        path: 'product',
        populate: { path: 'marketId', select: 'name logoUrl' }
      });
      // Scrapes delete expired products; skip favourites that now point to nothing
      // (clients read favorite.product._id).
      res.json(favorites.filter((f) => f.product));
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  })
  .post(protect, validateBody(favoriteSchema), async (req: any, res) => {
    try {
      const { productId } = req.body;
      const alreadyFavorited = await Favorite.findOne({ user: req.user._id, product: productId });
      
      if (alreadyFavorited) {
        await Favorite.findByIdAndDelete(alreadyFavorited._id);
      } else {
        await Favorite.create({ user: req.user._id, product: productId });
      }

      // Return updated list of favorited product IDs
      const updatedFavorites = await Favorite.find({ user: req.user._id });
      const favoriteIds = updatedFavorites.map(f => f.product.toString());
      
      res.json({ favorites: favoriteIds });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

export default router;
