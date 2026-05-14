import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import Product from '../models/Product';
import Market from '../models/Market';

dotenv.config();

const checkData = async () => {
  try {
    await connectDB();
    const sok = await Market.findOne({ name: 'ŞOK' });
    if (!sok) {
        console.log('ŞOK market not found');
        return;
    }
    const products = await Product.find({ marketId: sok._id }).limit(10);
    console.log('ŞOK Products Sample:');
    products.forEach((p: any) => {
        console.log(`- ${p.name}: ${p.price} TL | Promo: ${p.promotionText} | PromoPrice: ${p.promotionPrice} TL`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkData();
