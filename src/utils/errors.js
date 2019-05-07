const logger = require('./logger');

module.exports = {
    handleRequestError: (err, showOptions = false, location = '') => {
        const options = showOptions ? err.options : null;
        const error = {
            name: err.name,
            location: location,
            statusCode: err.statusCode,
            cause: err.cause,
            uri: err.options.uri,
            options
        }
        logger.error(error);
    }
}