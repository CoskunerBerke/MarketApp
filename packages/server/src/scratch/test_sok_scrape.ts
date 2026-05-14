import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import { triggerSokScrape } from '../services/scraperService';

dotenv.config();

const runTest = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting ŞOK scrape...');
    await triggerSokScrape();
    console.log('ŞOK scrape finished.');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTest();
