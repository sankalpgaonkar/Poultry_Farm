const mongoose = require('mongoose');
const config = require('./env');

// Cache the connection across serverless invocations (Vercel) and hot reloads.
let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

mongoose.set('strictQuery', true);

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(config.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .then((m) => {
        if (!config.isTest) console.log(`[db] connected to ${m.connection.host}/${m.connection.name}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[db] connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
