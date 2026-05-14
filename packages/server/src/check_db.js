const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Also try to find one user in any collection that looks like users
    for (const coll of collections) {
      if (coll.name.toLowerCase().includes('user')) {
        const count = await mongoose.connection.db.collection(coll.name).countDocuments();
        console.log(`Collection ${coll.name} has ${count} documents.`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCollections();
