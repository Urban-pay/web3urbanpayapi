const axios = require("axios");
require("dotenv").config();

const finapiKey = process.env.finapiKey;
// const apiKey = process.env.apiKey;
const BASE_URL = 'https://finnhub.io/api/v1';
// console.log(finapiKey);
const getStockData = async (symbol) => {
    try {
        const response = await axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${finapiKey}`);
        console.log(response.data);
    
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}; 

getStockData('AAPL'); // Fetch data for Apple Inc.


// Utility function to fetch data from the Finnhub API
const fetchStockData = async (symbol, endpoint) => {
    const url = `${BASE_URL}/${endpoint}?symbol=${symbol}&token=${finapiKey}`;
    const response = await axios.get(url);
    return response.data;
};

// Controller function to fetch real-time stock price
exports.getRealTimeStock = async (req, res) => {
    const { symbol } = req.params;

    try {
        const data = await fetchStockData(symbol, 'quote');
        res.json(data);
    } catch (error) {
        console.error('Error fetching real-time data:', error);
        res.status(500).json({
             message: 'Error fetching real-time data'
             });
    }
};

// Middleware function to check Redis cache
const cacheMiddleware = (req, res, next) => {
    const { symbol, type } = req.params;
    const cacheKey = `${symbol}_${type}`;

    req.redisClient.get(cacheKey, (err, data) => {
        if (err) {
            console.error('Redis error:', err);
            next();
        } else if (data !== null) {
            return res.json(JSON.parse(data));
        } else {
            next();
        }
    });
};

// Controller function to fetch historical stock data with caching
exports.getHistoricalStock = [
    cacheMiddleware, // Use the cache middleware before fetching data
    async (req, res) => {
        const { symbol, type } = req.params;

        try {
            const endpoint = type === 'daily' ? 'stock/candle' : 'stock/candle'; // Adjust as needed
            const data = await fetchStockData(symbol, endpoint);

            // Cache the result with an expiry time of 1 hour (3600 seconds)
            req.redisClient.setex(`${symbol}_${type}`, 3600, JSON.stringify(data));

            res.json(data);
        } catch (error) {
            console.error('Error fetching historical data:', error);
            res.status(500).json({
                 message: 'Error fetching historical data' 
                });
        }
    }
];

