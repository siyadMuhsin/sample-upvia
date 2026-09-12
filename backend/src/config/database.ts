import mongoose from 'mongoose';
import { ENV } from './environment';

let mongodInstance: any = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If explicitly requested to run zero-db standalone mode
  if (process.env.USE_EMBEDDED_DB === 'true' || process.env.MONGODB_URI === 'embedded') {
    console.log('[Database] USE_EMBEDDED_DB requested. Initializing embedded in-memory MongoDB engine...');
    return connectEmbeddedDatabase();
  }

  try {
    // Attempt standard connection first
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected to MongoDB at ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${ENV.MONGODB_URI}.`);
    console.log('[Database] Initializing embedded MongoDB engine for seamless development/testing...');
    return connectEmbeddedDatabase();
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
