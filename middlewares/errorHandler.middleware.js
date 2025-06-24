const HttpStatus = require('../enums/httpStatusCode.enum');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.error(
            HttpStatus.BAD_REQUEST,
            false,
            "Validation Error",
            err.errors
        );
    }

    if (err.name === 'SequelizeValidationError') {
        return res.error(
            HttpStatus.BAD_REQUEST,
            false,
            "Database Validation Error",
            err.errors.map(e => e.message)
        );
    }

    return res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        false,
        "Internal Server Error",
        err.message
    );
};

module.exports = errorHandler;