const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timeStamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get("User-Agent");

  res.on('finish', () => {
    const duration = Date.now() - start;
    const size = res.get('Content-Length') || 0;
    console.log(
      `${timeStamp} - ${method} - ${url} - Status: ${res.statusCode} - Duration: ${duration}ms - Size: ${size}bytes - User-Agent: ${userAgent}`
    );
  });

  next();
}

const addTimeStamp = (req, res, next) => {
  const timeStamp = new Date().toISOString();
  res.setHeader("X-Request-Timestamp", timeStamp);
  next();
}

module.exports = { requestLogger, addTimeStamp }