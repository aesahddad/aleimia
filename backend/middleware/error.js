const logger = require('../shared/logger');
const { error: sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    return sendError(res, err.message || 'Server Error', statusCode);
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
