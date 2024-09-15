const axios = require('axios');
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
