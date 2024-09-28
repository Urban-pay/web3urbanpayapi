module.exports = (req, res, next) => {
    const { symbol, type } = req.params;
    const cacheKey = `${symbol}_${type}`;

    req.redisClient.get(cacheKey, (err, data) => {
        if (err) {
            console.error('Redis error:', err);
            next(); // Continue to the next middleware/controller even if there's an error with Redis
        } else if (data !== null) {
            return res.json(JSON.parse(data)); // Send the cached data
        } else {
            next(); // Continue to the controller if data is not found in cache
        }
    });
};
