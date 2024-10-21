const handleError = (res, errorType) => {
  if (errorType === 'insufficient_funds') {
      return res.status(400).json({
          message: 'Insufficient funds for this transaction'
      });
  } else if (errorType === 'stock_unavailable') {
      return res.status(404).json({
          message: 'Stock unavailable'
      });
  } else {
      return res.status(500).json({
          message: 'General server error'
      });
  }
};

module.exports = { handleError };
