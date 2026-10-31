/**
 * routes/stockRoutes.js
 * 
 * Purpose: Defines Express REST API endpoints for stock CRUD operations and health check.
 * 
 * Endpoints implemented:
 * 1. GET    /api/stocks     -> Retrieve all stocks from watchlist (Sorted newest first)
 * 2. POST   /api/stocks     -> Add a new stock to watchlist
 * 3. GET    /api/stocks/:id -> Retrieve a single stock by MongoDB _id
 * 4. DELETE /api/stocks/:id -> Remove a stock from watchlist by MongoDB _id
 * 5. GET    /api/health     -> Check backend server and database connection health
 */

const express = require('express');
const mongoose = require('mongoose');
const Stock = require('../models/Stock');

const router = express.Router();

// =========================================================================
// 5. GET /api/health - Health check endpoint
// =========================================================================
router.get('/health', (req, res) => {
  // Check MongoDB connection state:
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbStateMap[dbState] || 'unknown';

  return res.status(200).json({
    success: true,
    message: 'Backend server is running smoothly.',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'stock_watchlist'
    }
  });
});

// =========================================================================
// 1. GET /api/stocks - Retrieve all saved stocks
// =========================================================================
router.get('/stocks', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please check your MongoDB Atlas connection.'
      });
    }

    // Fetch all stocks, sorted by newest first (-1)
    const stocks = await Stock.find().sort({ addedAt: -1 });

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching stocks from database.',
      error: error.message
    });
  }
});

// =========================================================================
// 2. POST /api/stocks - Add a new stock
// =========================================================================
router.post('/stocks', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please check your MongoDB Atlas connection.'
      });
    }

    const { symbol, companyName, exchange } = req.body;

    // Basic Input Validation
    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required.'
      });
    }

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required.'
      });
    }

    // Clean inputs
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompanyName = companyName.trim();
    const cleanExchange = exchange && exchange.trim() ? exchange.trim().toUpperCase() : 'NASDAQ';

    // Create a new stock document
    const newStock = new Stock({
      symbol: cleanSymbol,
      companyName: cleanCompanyName,
      exchange: cleanExchange
    });

    // Save to MongoDB
    const savedStock = await newStock.save();

    return res.status(201).json({
      success: true,
      message: `Stock '${savedStock.symbol}' added successfully to your watchlist!`,
      data: savedStock
    });
  } catch (error) {
    console.error('Error creating stock:', error);

    // Handle MongoDB Duplicate Key Error (Code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Stock symbol '${req.body.symbol?.toUpperCase()}' is already in your watchlist! Duplicate stocks are not allowed.`
      });
    }

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error while adding stock.',
      error: error.message
    });
  }
});

// =========================================================================
// 3. GET /api/stocks/:id - Retrieve one stock by MongoDB ID
// =========================================================================
router.get('/stocks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock ID format. Must be a 24-character hexadecimal string.'
      });
    }

    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `No stock found with ID: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching stock by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching stock details.',
      error: error.message
    });
  }
});

// =========================================================================
// 4. DELETE /api/stocks/:id - Delete a stock by ID
// =========================================================================
router.delete('/stocks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock ID format.'
      });
    }

    const deletedStock = await Stock.findByIdAndDelete(id);

    if (!deletedStock) {
      return res.status(404).json({
        success: false,
        message: `Cannot delete. Stock with ID ${id} was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Stock '${deletedStock.symbol}' (${deletedStock.companyName}) removed successfully from your watchlist.`,
      data: deletedStock
    });
  } catch (error) {
    console.error('Error deleting stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting stock.',
      error: error.message
    });
  }
});

module.exports = router;
