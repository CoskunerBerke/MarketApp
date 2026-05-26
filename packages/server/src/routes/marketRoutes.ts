import express from 'express';
import Market from '../models/Market';
import { protect, admin } from '../middleware/authMiddleware';
import { validateBody, marketSchema } from '../middleware/validationMiddleware';
import { auditLogAction } from '../middleware/auditLogger';

const router = express.Router();

// GET all markets - Public
router.get('/', async (req, res) => {
  try {
    const markets = await Market.find({ isActive: true });
    res.json(markets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST create market - Admin Only
router.post('/', protect, admin, validateBody(marketSchema), async (req: any, res) => {
  try {
    const market = new Market(req.body);
    const createdMarket = await market.save();
    
    auditLogAction(req, `Market Created: ${createdMarket.name} (${createdMarket._id})`, 'success');
    res.status(201).json(createdMarket);
  } catch (error: any) {
    auditLogAction(req, 'Market Creation Failed', 'failure', error.message);
    res.status(400).json({ message: 'Geçersiz market verisi.' });
  }
});

// PUT update market - Admin Only
router.put('/:id', protect, admin, validateBody(marketSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const updatedMarket = await Market.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedMarket) {
      auditLogAction(req, `Market Update Failed: Market ${id} not found`, 'failure');
      return res.status(404).json({ message: 'Market bulunamadı.' });
    }
    
    auditLogAction(req, `Market Updated: ${updatedMarket.name} (${id})`, 'success');
    res.json(updatedMarket);
  } catch (error: any) {
    auditLogAction(req, `Market Update Failed for ID ${req.params.id}`, 'failure', error.message);
    res.status(400).json({ message: 'Güncelleme başarısız.' });
  }
});

// DELETE market - Admin Only
router.delete('/:id', protect, admin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const deletedMarket = await Market.findByIdAndDelete(id);
    
    if (!deletedMarket) {
      auditLogAction(req, `Market Deletion Failed: Market ${id} not found`, 'failure');
      return res.status(404).json({ message: 'Market bulunamadı.' });
    }
    
    auditLogAction(req, `Market Deleted: ${deletedMarket.name} (${id})`, 'success');
    res.json({ message: 'Market başarıyla silindi.' });
  } catch (error: any) {
    auditLogAction(req, `Market Deletion Failed for ID ${req.params.id}`, 'failure', error.message);
    res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
});

export default router;
