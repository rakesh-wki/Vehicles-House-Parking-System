module.exports = (status, message, details = {}) => {
  const error = new Error(message);
  error.status = status;
  if (details && Object.keys(details).length > 0) {
    error.details = details;
  }
  return error;
};

