import mongoose from 'mongoose';

/**
 * Integration tests need a MongoDB-compatible server. Set TEST_MONGODB_URI
 * (e.g. mongodb://127.0.0.1:27017) to run them; CI starts a mongo service.
 * Without it the database suites are skipped and the unit suites still run.
 */
export const testDbUri = process.env.TEST_MONGODB_URI;
export const hasTestDb = Boolean(testDbUri);

export const connectTestDb = async (dbName: string) => {
  await mongoose.connect(testDbUri as string, { dbName });
  await mongoose.connection.dropDatabase();
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};
