
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4045;

// Middleware to parse JSON requests
// app.use(bodyParser.json());
app.use(express.json());


// Use the routes defined in router.js
app.use('/api', router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
