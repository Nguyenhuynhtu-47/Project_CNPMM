const sendSuccess = (res, { statusCode = 200, message, data = {} }) => {
  return res.status(statusCode).json({
    ...(message ? { message } : {}),
    ...data
  });
};

const sendError = (res, { statusCode = 500, message }) => {
  return res.status(statusCode).json({ message });
};

module.exports = {
  sendSuccess,
  sendError
};
