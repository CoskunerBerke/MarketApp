const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the server folder
dotenv.config({ path: path.join(__dirname, '../packages/server/.env') });

const UserSchema = new mongoose.Schema({
  email: String,
});
const User = mongoose.model('User', UserSchema);

async function normalizeEmails() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Normalizing...`);

    let count = 0;
    for (const user of users) {
      if (user.email) {
        const normalized = user.email.toLowerCase().trim();
        if (normalized !== user.email) {
          user.email = normalized;
          await user.save();
          console.log(`Normalized: ${normalized}`);
          count++;
        }
      }
    }

    console.log(`${count} emails normalized successfully.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

normalizeEmails();
