import mongoose from 'mongoose';

const RETRY_INTERVAL_MS = 30000; // 30-second retry interval
let retryTimer = null;
let isConnecting = false;
let listenersAttached = false;

/**
 * Attaches Mongoose connection lifecycle event listeners
 */
const setupConnectionEvents = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connected successfully');
    clearRetryTimer();
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
    scheduleRetry();
  });

  mongoose.connection.on('error', (err) => {
    console.warn(`[MongoDB Warning] Connection error (${err.message || 'unknown error'})`);
  });
};

/**
 * Clears any pending retry timer
 */
const clearRetryTimer = () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

/**
 * Schedules a single background connection retry
 */
const scheduleRetry = () => {
  if (retryTimer) return; // Prevent duplicate timers
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return; // Already connected or connecting

  console.log(`[MongoDB] Retry scheduled in ${RETRY_INTERVAL_MS / 1000}s...`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, RETRY_INTERVAL_MS);
};

/**
 * Connect to MongoDB database with non-blocking background retry
 */
export const connectDB = async () => {
  setupConnectionEvents();

  // Guard: Avoid redundant connection attempts
  if (mongoose.connection.readyState === 1) {
    clearRetryTimer();
    return;
  }
  if (isConnecting || mongoose.connection.readyState === 2) {
    return;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/smartcity3d';
  isConnecting = true;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000 // 10s timeout for remote cloud Atlas connection
    });
    clearRetryTimer();
  } catch (error) {
    console.warn(`[MongoDB Warning] Connection failed (${error.message || 'connection failed'})`);
    console.warn('[MongoDB Notice] The server and 3D web application will continue running with in-memory fallback.');
    scheduleRetry();
  } finally {
    isConnecting = false;
  }
};
