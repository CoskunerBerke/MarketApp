import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../packages/server/.env') });

const UserSchema = new mongoose.Schema({
  email: String,
});
const User = mongoose.model('User', UserSchema);

async function normalizeEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected.');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Normalizing...`);

    for (const user of users) {
      if (user.email) {
        const normalized = user.email.toLowerCase().trim();
        if (normalized !== user.email) {
          user.email = normalized;
          await user.save();
          console.log(`Normalized: ${normalized}`);
        }
      }
    }

    console.log('All emails normalized successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

normalizeEmails();
