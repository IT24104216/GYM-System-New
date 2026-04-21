import mongoose from 'mongoose';
import { env } from './env.js';

const isSrvDnsError = (error) => (
  ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEOUT', 'ESERVFAIL'].includes(error?.code)
  && String(error?.hostname || '').startsWith('_mongodb._tcp.')
);

export async function connectDb() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured. Set it in backend/.env');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI);
    return mongoose.connection;
  } catch (error) {
    if (isSrvDnsError(error) && env.MONGODB_URI_FALLBACK) {
      await mongoose.connect(env.MONGODB_URI_FALLBACK);
      return mongoose.connection;
    }

    if (isSrvDnsError(error) && !env.MONGODB_URI_FALLBACK) {
      throw new Error(
        'MongoDB SRV DNS lookup failed. If you are on hotspot/mobile network, add MONGODB_URI_FALLBACK (non-SRV mongodb:// URI) in backend/.env and restart server.',
      );
    }

    throw error;
  }
}
