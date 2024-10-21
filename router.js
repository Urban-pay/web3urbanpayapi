const express = require('express');
const { buyStock, sellStock, getPositions, getAllTransactions, getAvailableStocks} = require('./controllers/controller');

const router = express.Router();

// Route to buy stock
router.post('/stocks/buy', buyStock);

// Route to sell stock
router.post('/stocks/sell', sellStock);

// Route to get current positions
router.get('/positions', getPositions);

router.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is working!'
     });
  });
  
 // Route to get all stock transactions
router.get('/transactions', getAllTransactions);


// Route to get available stocks
router.get('/stocks', getAvailableStocks);



// Stock history routers
const { getRealTimeStock, getHistoricalStock } = require('./controllers/stockController');
const { trackHoldings, generateReport, setupNotifications } = require('./controllers/portfolioController');


// Real-time stock price
router.post('/real-time', getRealTimeStock);

// Historical stock data with caching route
router.get('/:symbol/:type', getHistoricalStock);

router.get('/holdings', trackHoldings);

// Route to generate portfolio performance report
router.get('/report', generateReport);


// Route to start real-time notifications for stock prices
router.post('/notify', setupNotifications);



module.exports = router;
