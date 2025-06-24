const HttpStatus = require('../enums/httpStatusCode.enum');

const handleNotFound = (req, res) => {
    return res.error(
        HttpStatus.NOT_FOUND,
        false,
        "Route not found",
        `${req.method} ${req.url} not found`
    );
};

module.exports = handleNotFound;