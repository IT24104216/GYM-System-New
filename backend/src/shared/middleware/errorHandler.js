export function errorHandler(err, _req, res, _next) {
  void _next;
  const statusCode = err.statusCode || 500;

  const response = {
    message: err.message || 'Internal server error',
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
