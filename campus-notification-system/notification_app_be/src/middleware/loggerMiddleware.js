const { v4: uuidv4 } = require('uuid');

const loggerMiddleware = (req, res, next) => {
    req.id = uuidv4(); // Generate a unique request ID
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.id} - ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`
        );
    });

    next();
};

module.exports = loggerMiddleware;
