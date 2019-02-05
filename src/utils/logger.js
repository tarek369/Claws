require('dotenv').config();
const winston = require('winston');

let winstonTransports = [];

if (process.env.FILE_LOGGING === 'true' && process.env.CLAWS_ENV === 'server' && process.env.NODE_ENV === 'production' && process.env.SILENCE_LOGS !== "true") {
    // The client-side scraper doesn't need a log file or the app-root-path module.
    const appRoot = require('app-root-path');
    winstonTransports.push(
        new winston.transports.File({
            level: 'error',
            filename: `${appRoot}/logs/app.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            colorize: false,
        })
    );
}

if (process.env.NODE_ENV === 'development') {
    const {LEVEL, MESSAGE} = require('triple-beam');
    winstonTransports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL,
            log(info, callback) {
                setImmediate(() => this.emit('logged', info));

                if (this.stderrLevels[info[LEVEL]]) {
                    console.error(info[MESSAGE]);

                    if (callback) {
                        callback();
                    }
                    return;
                }

                console.log(info[MESSAGE]);

                if (callback) {
                    callback();
                }
            }
        })
    );
} else {
    winstonTransports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL,
            handleExceptions: true,
            json: false,
            colorize: true,
            silent: process.env.SILENCE_LOGS === "true"
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
        // uses the 'info' log level so the output will be picked up by all the available transports (file and console)
        logger.http(message);
    },
};

module.exports = logger;