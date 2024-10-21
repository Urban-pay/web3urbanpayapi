
const express = require('express');
const bodyParser = require('body-parser');
const redis = require("redis")
const router = require('./router');
// require("./stock-prices-history-data")
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4046;

// app.use(bodyParser.json());
app.use(express.json());

// Redis client setup
const redisClient = redis.createClient();



redisClient.on('error', (err) => {
    console.error('Redis error:', err);
    res.status(500).json({
      message: 'Redis error:', err
    })
});

// redisClient.connect().then(() => {
//   console.log('Connected to Redis');
// }).catch(err => {
//   console.error('Failed to connect to Redis:', err);
// });

// Make the Redis client available globally
app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

// Use stock routes
// app.use('/stock', stockRoutes);


// Use the routes defined in router.js
app.use('/api', router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
