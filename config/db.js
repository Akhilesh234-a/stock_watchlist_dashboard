/**
 * config/db.js
 * 
 * Purpose: Connects our Node.js Express application to MongoDB Atlas using Mongoose.
 * Concept: Mongoose provides an Object Data Modeling (ODM) layer on top of MongoDB,
 * making schema definition, validation, and database operations simple and safe.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ Error: MONGODB_URI is not defined in your .env file.');
      console.log('👉 Please set MONGODB_URI in your .env file with your MongoDB Atlas connection string.');
      return;
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      // Modern Mongoose v6+ uses these defaults automatically, but specifying helps beginner understanding
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('💡 Quick Troubleshooting Tips:');
    console.log('   1. Check if your MongoDB Atlas username and password are correct.');
    console.log('   2. Verify that Network Access in MongoDB Atlas allows IP 0.0.0.0/0 (anywhere).');
    console.log('   3. If using local MongoDB, ensure the MongoDB service is running (mongod).');
    // We do not exit the process here so that the server can still run and serve static frontend files,
    // while returning clear 503/500 database status to the frontend.
  }
};

// Listen to connection events for real-time logging
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB Reconnected.');
});

module.exports = connectDB;
