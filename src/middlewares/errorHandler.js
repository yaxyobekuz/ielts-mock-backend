const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) console.error(err);

  const status = err.statusCode || 500;
  const code = err.code || "serverError";

  res.status(status).json({
    code,
    details: isDevelopment ? err.message || err : undefined,
    message: status === 500 ? "Serverda ichki xatolik" : err.message,
  });
};

module.exports = errorHandler;
