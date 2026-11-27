export function notFound(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// Express recognises an error handler by its 4 parameters, so keep `next` here.
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: { message: status >= 500 ? "Internal server error" : err.message },
  });
}