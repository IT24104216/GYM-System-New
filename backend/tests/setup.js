import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config();

mongoose.set('bufferCommands', false);

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const withDbName = (uri, dbName) => {
  if (!uri) return '';
  if (uri.includes(`/${dbName}`)) return uri;
  if (!(uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://'))) return uri;

  const [base, query] = uri.split('?');
  const parsed = base.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/.*)?$/);
  if (!parsed) return uri;

  const root = parsed[1];
  const path = parsed[2] || '';
  const normalizedPath = (!path || path === '/') ? `/${dbName}` : path;
  const normalizedBase = `${root}${normalizedPath}`;
  return query ? `${normalizedBase}?${query}` : normalizedBase;

};

let mongoServer = null;
let testDbUri = withDbName(process.env.MONGODB_URI_TEST, 'gympro_test');

if (!testDbUri) {
  testDbUri = withDbName(process.env.MONGODB_URI, 'gympro_test');
}

if (!testDbUri) {
  try {
    mongoServer = await MongoMemoryServer.create();
    testDbUri = mongoServer.getUri('gympro_test');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[tests/setup] Unable to start mongodb-memory-server and no test URI is configured.');
    throw error;
  }
}

process.env.MONGODB_URI = testDbUri;
await mongoose.connect(testDbUri, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  dbName: 'gympro_test',
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(testDbUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      dbName: 'gympro_test',
    });
  }
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
