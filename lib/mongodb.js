import mongoose from 'mongoose';

const LOCAL_FALLBACK = 'mongodb://127.0.0.1:27017/minds';

function getMongoUri() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
  if (!uri || uri.includes('your_mongodb_')) {
    return LOCAL_FALLBACK;
  }
  return uri;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Gracefully skip connecting during Next.js build / page data collection
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.BUILDING === 'true') {
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    };

    const primaryUri = getMongoUri();

    cached.promise = mongoose.connect(primaryUri, opts)
      .then((m) => {
        console.log(`✅ MongoDB connected successfully (${primaryUri.includes('127.0.0.1') ? 'Local MongoDB' : 'Atlas/Remote'})`);
        return m;
      })
      .catch(async (primaryErr) => {
        if (primaryUri !== LOCAL_FALLBACK) {
          console.warn(`⚠️ Primary MongoDB connection failed (${primaryErr.message}). Attempting fallback to local MongoDB...`);
          try {
            const fallbackConn = await mongoose.connect(LOCAL_FALLBACK, opts);
            console.log('✅ Connected to local MongoDB fallback successfully');
            return fallbackConn;
          } catch (fallbackErr) {
            console.error('❌ Local MongoDB fallback also failed:', fallbackErr.message);
            throw primaryErr;
          }
        }
        throw primaryErr;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('MongoDB connection error:', e.message || e);
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null;
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;