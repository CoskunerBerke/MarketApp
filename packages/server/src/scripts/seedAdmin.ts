import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('[SEED ERROR] ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser) {
      existingUser.role = 'admin';
      existingUser.passwordHash = passwordHash;
      await existingUser.save();
      console.log(`[SEED SUCCESS] Existing user (${normalizedEmail}) promoted to Admin and password updated.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    await User.create({
      email: normalizedEmail,
      passwordHash,
      role: 'admin'
    });

    console.log(`[SEED SUCCESS] Admin user (${normalizedEmail}) created successfully.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('[SEED ERROR] Failed to seed admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
