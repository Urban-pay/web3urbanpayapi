const axios = require('axios');
require("dotenv").config

// Alpaca Paper Trading API Credentials (Replace with your own API credentials)
const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const BASE_URL = 'https://paper-api.alpaca.markets/v2';


// Axios instance for Alpaca API
const alpacaApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'APCA-API-KEY-ID': API_KEY,
    'APCA-API-SECRET-KEY': SECRET_KEY,
  },
});

// Function to place a buy order
const buyStock = async (symbol, qty) => {
  const orderData = {
    symbol: symbol,  // Stock symbol, e.g., AAPL for Apple
    qty: qty,        // Quantity of shares to buy
    side: 'buy',     // "buy" or "sell"
    type: 'market',  // "market", "limit", etc.
    time_in_force: 'gtc',  // "gtc" (Good Till Canceled) or other time-in-force options
  };

  try {
    const response = await alpacaApi.post('/v2/orders', orderData);
    console.log('Buy Order Placed:', response.data);
  } catch (error) {
    console.error('Error placing buy order:', error.response?.data || error.message);
  }
};

// Function to place a sell order
const sellStock = async (symbol, qty) => {
  const orderData = {
    symbol: symbol,  // Stock symbol, e.g., AAPL for Apple
    qty: qty,        // Quantity of shares to sell
    side: 'sell',    // "buy" or "sell"
    type: 'market',  // "market", "limit", etc.
    time_in_force: 'gtc',  // "gtc" (Good Till Canceled) or other time-in-force options
  };

  try {
    const response = await alpacaApi.post('/v2/orders', orderData);
    console.log('Sell Order Placed:', response.data);
  } catch (error) {
    console.error('Error placing sell order:', error.response?.data || error.message);
  }
};

// Function to get current positions
const getPositions = async () => {
  try {
    const response = await alpacaApi.get('/v2/positions');
    console.log('Current Positions:', response.data);
  } catch (error) {
    console.error('Error fetching positions:', error.response?.data || error.message);
  }
};

// Demo: Buy and Sell a Stock
(async () => {
  // Buy 1 share of Apple stock (AAPL)
  await buyStock('AAPL', 1);

  // Pause for a few seconds to simulate time passing
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check current positions (after the buy order)
  await getPositions();

  // Pause for a few seconds before selling
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Sell 1 share of Apple stock (AAPL)
  await sellStock('AAPL', 1);

  // Check positions after the sell
  await getPositions();
})();

// const Alpaca = require("@alpacahq/alpaca-trade-api");
// const alpaca = new Alpaca();

// // Get our account information.
// alpaca.getAccount().then((account) => {
//   // Check if our account is restricted from trading.
//   if (account.trading_blocked) {
//     console.log("Account is currently restricted from trading.");
//   }

//   // Check how much money we can use to open new positions.
//   console.log(`$${account.buying_power} is available as buying power.`);
// });
