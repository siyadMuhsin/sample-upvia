import mongoose from 'mongoose';
import { ENV } from './environment';

let mongodInstance: any = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // The in-memory MongoMemoryServer is a test-only convenience. Outside of
  // automated tests, a bad MONGODB_URI or an unreachable database must fail
  // loudly and immediately — silently falling back to an empty ephemeral DB
  // in dev/QA masks real connectivity/config problems.
  const isTestEnv = ENV.NODE_ENV === 'test';

  const hasExternalUri =
    !!process.env.MONGODB_URI &&
    process.env.MONGODB_URI !== 'embedded' &&
    !process.env.MONGODB_URI.includes('127.0.0.1') &&
    !process.env.MONGODB_URI.includes('localhost');

  if (isTestEnv && !hasExternalUri && (process.env.USE_EMBEDDED_DB === 'true' || process.env.MONGODB_URI === 'embedded')) {
    console.log('[Database] Test environment detected. Initializing embedded in-memory MongoDB engine...');
    return connectEmbeddedDatabase();
  }

  try {
    // Attempt standard connection first
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] Connected to MongoDB at ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.error(`[Database] Failed to connect to MongoDB at ${ENV.MONGODB_URI}:`, error);

    if (isTestEnv) {
      console.log('[Database] Test environment detected. Falling back to embedded in-memory MongoDB engine...');
      return connectEmbeddedDatabase();
    }

    console.error('[Database] Refusing to start without a working database connection. Check MONGODB_URI and that MongoDB is reachable.');
    process.exit(1);
  }
};

const connectEmbeddedDatabase = async (): Promise<void> => {
  try {
    if (!mongodInstance) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: {
          version: process.env.MONGOMS_VERSION || '7.0.11',
        },
      });
    }
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Connected to embedded MongoDB instance at ${uri}`);
  } catch (memError) {
    console.error('[Database] Failed to connect to any MongoDB instance:', memError);
    throw memError;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
