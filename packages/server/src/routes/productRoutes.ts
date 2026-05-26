import express from 'express';
import Product from '../models/Product';
import { protect, admin } from '../middleware/authMiddleware';
import { validateBody, productSchema } from '../middleware/validationMiddleware';
import { auditLogAction } from '../middleware/auditLogger';

const router = express.Router();

// GET all products - Public
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

// POST create product - Admin Only
router.post('/', protect, admin, validateBody(productSchema), async (req: any, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    
    auditLogAction(req, `Product Created: ${createdProduct.name} (${createdProduct._id})`, 'success');
    res.status(201).json(createdProduct);
  } catch (error: any) {
    auditLogAction(req, 'Product Creation Failed', 'failure', error.message);
    res.status(400).json({ message: 'Geçersiz ürün verisi.' });
  }
});

// PUT update product - Admin Only
router.put('/:id', protect, admin, validateBody(productSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      auditLogAction(req, `Product Update Failed: Product ${id} not found`, 'failure');
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }
    
    auditLogAction(req, `Product Updated: ${updatedProduct.name} (${id})`, 'success');
    res.json(updatedProduct);
  } catch (error: any) {
    auditLogAction(req, `Product Update Failed for ID ${req.params.id}`, 'failure', error.message);
    res.status(400).json({ message: 'Güncelleme başarısız.' });
  }
});

// DELETE product - Admin Only
router.delete('/:id', protect, admin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      auditLogAction(req, `Product Deletion Failed: Product ${id} not found`, 'failure');
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }
    
    auditLogAction(req, `Product Deleted: ${deletedProduct.name} (${id})`, 'success');
    res.json({ message: 'Ürün başarıyla silindi.' });
  } catch (error: any) {
    auditLogAction(req, `Product Deletion Failed for ID ${req.params.id}`, 'failure', error.message);
    res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
});

export default router;
