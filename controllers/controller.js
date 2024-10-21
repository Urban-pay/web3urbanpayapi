const axios = require('axios');
const promisePool = require("../db");
const { handleError } = require("./errorHandler");
require('dotenv').config();


const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const BASE_URL = 'https://paper-api.alpaca.markets/v2';
// console.log(API_KEY);

const finapiKey = process.env.finapiKey;
// const apiKey = process.env.apiKey;
const FINBASE_URL = 'https://finnhub.io/api/v1';

// Utility function to fetch data from the Finnhub API
const fetchStockData = async (symbol, endpoint) => {
  const url = `${FINBASE_URL}/${endpoint}?symbol=${symbol}&token=${finapiKey}`;
  const response = await axios.get(url);
  return response.data;
}; 

const alpacaApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'APCA-API-KEY-ID': API_KEY,
    'APCA-API-SECRET-KEY': SECRET_KEY,
  },
});


// Function to get account balance
const getAccountBalance = async () => {
  try {
      const response = await alpacaApi.get('/account');
      return response.data.cash; // Return available cash balance
  } catch (error) {
      console.error('Error fetching account balance:', error);
      throw new Error('Could not retrieve account balance');
  }
};


// Buy stock handler
exports.buyStock = async (req, res) => {
  const { symbol, qty, side, order_type, time_in_force  } = req.body;
  try { 
  if (!symbol || !qty) {
    return res.status(400).json({ 
      message: 'Missing symbol or quantity'
     });
}
  
      const data = await fetchStockData(symbol, 'quote');
      const currentPrice = data.c;
      console.log(currentPrice);

      if (!currentPrice) {
        return res.status(404).json({
            message: 'Stock price not available'
        });
    }
    // const message = await alpacaApi.get('/positions');
    // const positions = message.data;
    // console.log(positions);
    // const stockPosition = positions.find(pos => pos.symbol === symbol.toUpperCase());
    
    // // Retrieve purchase price 
    // const purchasePrice = stockPosition.avg_entry_price
    // console.log(purchasePrice);


  // Calculate total purchase cost
  const totalCost = currentPrice * qty;

  const availableBalance = await getAccountBalance();
  console.log(availableBalance);

if (totalCost > availableBalance) {
  return handleError(res, 'insufficient_funds');
}

const orderData = {
  symbol: symbol.toUpperCase(),  // Stock symbol, e.g., AAPL for Apple
  qty: qty,        // Quantity of shares to buy
  side: side,     // "buy" or "sell"
  type: order_type,  // "market", "limit", etc.
  time_in_force: time_in_force,  // "gtc" (Good Till Canceled) or other time-in-force options
};
    
    const response = await alpacaApi.post('/orders', orderData);

    // Save order to the database
    await promisePool.query(
        'INSERT INTO stock_transactions (symbol, qty, side, order_type, time_in_force, status, currentPrice,purchasePrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [symbol, qty, side, order_type, time_in_force, response.data.status,currentPrice,totalCost ]
      );

    res.status(200).json({ 
        message: 'Buy order placed', 
        data: response.data,
        currentPrice
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
  const { symbol, qty, side,order_type,time_in_force } = req.body;
  try {
  if (!symbol || !qty) {
    return res.status(400).json({ 
      message: 'Missing symbol or quantity'
     });
}


const data = await fetchStockData(symbol, 'quote');
const currentPrice = data.c;
 
const message = await alpacaApi.get('/v2/positions');
const positions = message.data;
console.log(positions); 

const stockPosition = positions.find(pos => pos.symbol === symbol.toUpperCase());
console.log(stockPosition);
if (!stockPosition) {
  return handleError(res, 'stock_unavailable');
}
// Retrieve purchase price 
const purchasePrice = stockPosition.avg_entry_price
console.log(purchasePrice);

const orderData = {
  symbol: symbol.toUpperCase(),  // Stock symbol, e.g., AAPL for Apple
  qty: qty,        // Quantity of shares to buy
  side: side,     // "buy" or "sell"
  type: order_type,  // "market", "limit", etc.
  time_in_force: time_in_force,  // "gtc" (Good Till Canceled) or other time-in-force options
};

    const response = await alpacaApi.post('/orders', orderData);
     // Save order to the database
     await promisePool.query(
      'INSERT INTO stock_transactions (symbol, qty, side, order_type, time_in_force, status, currentPrice,purchasePrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [symbol, qty, side, order_type, time_in_force, response.data.status,currentPrice,purchasePrice ]
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
         data: response.data 
        });
        console.log(response.data);
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
  

  // Get list of available stocks
exports.getAvailableStocks = async (req, res) => {
  try {
      const response = await alpacaApi.get('/assets');
      // Filter out only tradable assets
      const tradableStocks = response.data.filter(stock => stock.tradable);
      
      res.status(200).json({
          message: 'Available stocks fetched successfully',
          data: tradableStocks
      });
  } catch (error) {
      console.error('Error fetching available stocks:', error);
      res.status(500).json({
          message: 'Error fetching available stocks',
          error: error.response?.data || error.message
      });
  }
};
