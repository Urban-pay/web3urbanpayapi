const axios = require('axios');
const promisePool = require("../db")
require('dotenv').config();
const WebSocket = require('ws');
const WS_URL = 'wss://paper-api.alpaca.markets/stream';
const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const BASE_URL = 'https://paper-api.alpaca.markets/v2';
// console.log(API_KEY);


const alpacaApi = axios.create({
    baseURL: BASE_URL,
    headers: {
      'APCA-API-KEY-ID': API_KEY,
      'APCA-API-SECRET-KEY': SECRET_KEY,
    },
  });

  const finapiKey = process.env.finapiKey;

  const FINBASE_URL = 'https://finnhub.io/api/v1';

  const fetchStockData = async (symbol, endpoint) => {
    const url = `${FINBASE_URL}/${endpoint}?symbol=${symbol}&token=${finapiKey}`;
    const response = await axios.get(url);
    return response.data;
  };
  

// const getCurrentPrice = async (symbol) => {
//     try {
//     //   const response = await alpacaApi.get(`/assets/${symbol}`);
//     //   return response.data.last_trade_price;
//     //   const response = await alpacaApi.get('/positions');
//     //   return response.data.current_price;
    
//     // const data = await fetchStockData(symbol, 'quote');
//     // const currentPrice = data.c;

//     } catch (error) {
//       console.error(`Error fetching current price for ${symbol}:`, error);
//       throw error;
//     }
//   };

const trackHoldings = async (req, res) => {
    try {
      // Fetch stock_transactions transactions without user_id filtering
      const [stock_transactions] = await promisePool.execute(
        'SELECT symbol, qty, purchasePrice FROM stock_transactions'
      );
  
      // If no transactions found, return empty result
      if (!stock_transactions.length) {
        return res.status(404).json({ message: 'No transactions found' });
      }
  
      // Process each stock_transactions to calculate gain/loss
      const result = await Promise.all(stock_transactions.map(async (stock_transactions) => {
        const data = await fetchStockData(stock_transactions.symbol, 'quote');
        const currentPrice = data.c;
        // const currentPrice = await getCurrentPrice(stock_transactions.symbol);
        const gainLoss = (currentPrice - stock_transactions.purchasePrice)* stock_transactions.qty;
  
        return {
          symbol: stock_transactions.symbol,
          quantity: stock_transactions.qty,
          purchasePrice: stock_transactions.purchasePrice,
          currentPrice:currentPrice,
          gainLoss: gainLoss.toFixed(2)
        };
      }));
  
      // Return the result as JSON
      res.status(200).json({
        message: 'Holdings, Gains, and Losses calculated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error tracking holdings:', error);
      res.status(500).json({
        message: 'Error tracking holdings',
        error: error.message
      });
    }
  };

 
// Generate portfolio report
const generateReport = async (req, res) => {
  
  try {
    const [stock_transactions] = await promisePool.execute(
      'SELECT symbol, qty, purchasePrice, currentPrice FROM stock_transactions'  
    );
    let totalValue = 0;
    let totalGains = 0;
    stock_transactions.forEach(stock_transactions => {
      const stockValue = stock_transactions.currentPrice * stock_transactions.qty;
      const gain = (stock_transactions.currentPrice - stock_transactions.purchasePrice) * stock_transactions.qty;
      totalValue += stockValue;
      totalGains += gain;
    });
    res.status(200).json({
      totalValue: totalValue.toFixed(2),
      totalGains: totalGains.toFixed(2),
      holdings: stock_transactions
    });
  } catch (error) {
    res.status(500).json({
         message: 'Error generating report',
          error:error.message
         });
  }
};


// Function to start notifications
const setupNotifications = (req, res) => {
    const { symbols } = req.body; // Pass the stock symbols to track in req.body

    // If no symbols are provided, return an error
    if (!symbols || !symbols.length) {
        return res.status(400).json({ message: 'No stock symbols provided for tracking.' });
    }

    // Setup WebSocket connection to Alpaca API
    const ws = new WebSocket(WS_URL);

    // WebSocket connection opened
    ws.on('open', () => {
        console.log('WebSocket connection established');

        // Send authentication message
        ws.send(JSON.stringify({
            
            action: "auth",
            key: API_KEY, 
            secret: SECRET_KEY
        }));

        // Subscribe to stock price updates for specified symbols
        symbols.forEach(symbol => {
          console.log(`Subscribing to trades for ${symbol}`);
            ws.send(JSON.stringify({
                action: 'subscribe',
                trades: [`T.${symbol}`], // Subscribe to trades for each symbol
                quotes: [`Q.${symbol}`] 
            }));
        });
    });

    // Handle incoming messages (stock price updates)
    ws.on('message', (data) => {
        const message = JSON.parse(data);
              // Handle successful authorization
              if (message.stream === 'authorization' && message.data.status === 'authorized') {
                console.log('Successfully authenticated to WebSocket.');
            }
    
            // Handle subscription confirmation
            if (message.stream === 'subscriptions') {
                console.log('Successfully subscribed to:', message.data);
            }
    
            // Handle trade updates (for example, from T.TSLA, T.AAPL)
            if (message.stream && message.stream.startsWith('T.')) {
                console.log('Trade update for symbol:', message.data);
                // Process the trade data here (e.g., trigger notifications or store data)
            }
    
            // Handle quote updates (for example, from Q.TSLA, Q.AAPL)
            if (message.stream && message.stream.startsWith('Q.')) {
                console.log('Quote update for symbol:', message.data);
                // Process the quote data here
            }
    
            // Handle other types of messages (e.g., errors or warnings)
            else if (message.stream !== 'authorization') {
                console.log('Other message received:', message);
            }
        });
    
 // Respond to the client that notifications have been set up
 res.status(200).json({ 
  message: 'Notifications setup for real-time stock prices',
   symbols
   
  })
    // Handle WebSocket errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Close WebSocket connection after use (if needed)
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

   
};

// Error handling function
const handleError = (req, res) => {
  const { errorType } = req.body;

  if (errorType === 'insufficient_funds') {
    res.status(400).json({
       message: 'Insufficient funds for this transaction'
       });
  } else if (errorType === 'stock_unavailable') {
    res.status(404).json({
       message: 'Stock unavailable' 
      });
  } else {
    res.status(500).json({
       message: 'General server error' 
      });
  }
};




module.exports = {trackHoldings, generateReport, setupNotifications, handleError };
