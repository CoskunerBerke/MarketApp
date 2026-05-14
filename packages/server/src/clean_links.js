const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ProductSchema = new mongoose.Schema({
  sourceUrl: String
});

const Product = mongoose.model('Product', ProductSchema);

async function cleanLinks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ sourceUrl: { $regex: 'google.com/url\\?q=' } });
    console.log(`Found ${products.length} products with Google redirect links.`);

    for (const product of products) {
      try {
        const url = new URL(product.sourceUrl);
        const cleanUrl = url.searchParams.get('q');
        if (cleanUrl) {
          product.sourceUrl = cleanUrl;
          await product.save();
        }
      } catch (err) {
        console.error(`Error cleaning link: ${product.sourceUrl}`);
      }
    }

    console.log('Successfully cleaned all links.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanLinks();
