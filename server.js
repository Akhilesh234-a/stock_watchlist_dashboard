/**
 * server.js
 * 
 * Main Entry Point for the Stock Watchlist Dashboard Backend Application.
 * 
 * Features:
 * - Loads environment variables using dotenv
 * - Connects to MongoDB Atlas using Mongoose
 * - Serves static frontend files (HTML, CSS, JS) from the public/ folder
 * - Configures REST API routes under /api
 * - Includes CORS, JSON body parser, and student-friendly error handling
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const stockRoutes = require('./routes/stockRoutes');

// Initialize Express App
const app = express();

// Define Port
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// -------------------------------------------------------------
// Middlewares
// -------------------------------------------------------------
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse incoming URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------
// Mount all stock and health routes under /api
app.use('/api', stockRoutes);

// -------------------------------------------------------------
// Frontend Fallback Route
// -------------------------------------------------------------
// Any route not starting with /api is served the index.html page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------------------------------------------------
// Global Error Handling Middleware
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: err.message
  });
});

// -------------------------------------------------------------
// Start Express Server
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log('====================================================');
  console.log('🚀 Stock Watchlist Dashboard Server is Running!');
  console.log(`🌐 Local URL:    http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stocks API:   http://localhost:${PORT}/api/stocks`);
  console.log('====================================================');
});
