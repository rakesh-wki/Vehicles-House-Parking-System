module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err : {} });
};
