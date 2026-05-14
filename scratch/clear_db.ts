import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../packages/server/.env') });

async function clearProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const Product = mongoose.model('Product', new mongoose.Schema({}));
        const result = await Product.deleteMany({});
        console.log(`Cleared ${result.deletedCount} products.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearProducts();
