const axios = require('axios');
const promisePool = require("./db")
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const BASE_URL = 'https://paper-api.alpaca.markets/v2';
console.log(API_KEY);

const alpacaApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'APCA-API-KEY-ID': API_KEY,
    'APCA-API-SECRET-KEY': SECRET_KEY,
  },
});

// Buy stock handler
exports.buyStock = async (req, res) => {
  const { symbol, qty } = req.body;

  const orderData = {
    symbol,
    qty,
    side: 'buy',
    type: 'market',
    time_in_force: 'gtc',
  };

  try {
    const response = await alpacaApi.post('/orders', orderData);

    // Save order to the database
    await promisePool.query(
        'INSERT INTO stock_transactions (symbol, qty, side, type, time_in_force, status) VALUES (?, ?, ?, ?, ?, ?)',
        [symbol, qty, 'buy', 'market', 'gtc', response.data.status]
      );

    res.status(200).json({ 
        message: 'Buy order placed', 
        data: response.data
     });
  } catch (error) {
    res.status(500).json({ 
        message: 'Error placing buy order', 
        error: error.response?.data || error.message
     });
  }
};

// Sell stock handler
exports.sellStock = async (req, res) => {
  const { symbol, qty } = req.body;

  const orderData = {
    symbol,
    qty,
    side: 'sell',
    type: 'market',
    time_in_force: 'gtc',
  };

  try {
    const response = await alpacaApi.post('/orders', orderData);

     // Save order to the database
     await promisePool.query(
        'INSERT INTO stock_transactions (symbol, qty, side, type, time_in_force, status) VALUES (?, ?, ?, ?, ?, ?)',
        [symbol, qty, 'sell', 'market', 'gtc', response.data.status]
      );

    res.status(200).json({ 
        message: 'Sell order placed',
         data: response.data
         });
  } catch (error) {
    res.status(500).json({ 
        message: 'Error placing sell order', 
        error: error.response?.data || error.message
     });
  }
};

// Get positions handler
exports.getPositions = async (req, res) => {
  try {
    const response = await alpacaApi.get('/positions');
    res.status(200).json({
         message: 'Current positions fetched', 
         data: response.headers 
        });
        console.log(response.headers);
  } catch (error) {
    res.status(500).json({ 
        message: 'Error fetching positions', 
        error: error.response?.data || error.message 
    });
  }
};


// Get all stock transactions
exports.getAllTransactions = async (req, res) => {
    try {
      // Fetch all records from stock_transactions table
      const [rows] = await promisePool.query('SELECT * FROM stock_transactions');
      
      // Send the result as JSON
      res.status(200).json({
        message: 'All transactions fetched successfully',
        data: rows
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching transactions',
        error: error.message
      });
    }
  };
  