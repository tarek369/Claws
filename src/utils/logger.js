const winston = require('winston');

const winstonTransports = [
    new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    }),
];

if (process.env.CLAWS_ENV === 'server') {
    // The client-side scraper doesn't need a log file or the app-root-path module.
    const appRoot = require('app-root-path');
    winstonTransports.push(
        new winston.transports.File({
            level: 'info',
            filename: `${appRoot}/logs/app.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            colorize: false,
        })
    );
}

const logger = winston.createLogger({
    transports: winstonTransports,
    exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by all the available transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;