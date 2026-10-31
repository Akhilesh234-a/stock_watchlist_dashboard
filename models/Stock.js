/**
 * models/Stock.js
 * 
 * Purpose: Defines the Mongoose Schema and Model for a Stock in the database.
 * 
 * Database: stock_watchlist
 * Collection: stocks (Mongoose automatically pluralizes 'Stock' to 'stocks')
 * 
 * Fields:
 * - symbol: Unique stock ticker (e.g., AAPL, TSLA, INFY), required, stored in uppercase.
 * - companyName: Full name of the corporation (e.g., Apple Inc.), required.
 * - exchange: Stock exchange (e.g., NASDAQ, NYSE, NSE, BSE), optional.
 * - addedAt: The date & time when the user saved the stock to their watchlist.
 */

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      uppercase: true,     // Automatically converts ticker to UPPERCASE (e.g., "aapl" -> "AAPL")
      trim: true,          // Removes unwanted whitespace before/after the ticker
      unique: true,        // Ensures no duplicate tickers can be added to the database
      maxlength: [10, 'Stock symbol cannot exceed 10 characters']
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    exchange: {
      type: String,
      trim: true,
      default: 'NASDAQ',   // Default fallback if user leaves exchange blank
      maxlength: [20, 'Exchange name cannot exceed 20 characters']
    },
    addedAt: {
      type: Date,
      default: Date.now    // Sets the current timestamp when created
    }
  },
  {
    // Enable automatic creation of indexes (useful for unique symbol index)
    autoIndex: true
  }
);

// Create and export the Mongoose Model
// 'Stock' model maps to 'stocks' collection in MongoDB
const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
