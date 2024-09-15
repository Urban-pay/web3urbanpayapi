// router.js
const express = require('express');
const { buyStock, sellStock, getPositions } = require('./controller');

const router = express.Router();

// Route to buy stock
router.post('/buy', buyStock);

// Route to sell stock
router.post('/sell', sellStock);

// Route to get current positions
router.get('/positions', getPositions);

router.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
  });
  
 
module.exports = router;
