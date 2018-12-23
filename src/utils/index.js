// Import dependencies
const url = require('url');

const jwt = require('jsonwebtoken');

// Define utility functions.
let escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

module.exports = {
    debugLog: function () {
        if (process.env.VERBOSE_LOGGING === 'true') {
            console.log.apply(null, arguments);
        }
    },

    /**
     * Used to pad the series and episode numbers.
     * e.g. converts '1' to '01'.
     * @param value The number to pad.
     * @returns {string} The padded string.
     */
    padTvNumber: (value) => Number(value) < 10 ? `0${value}` : value,

    /**
     * Validates a request token in an ExpressJS request.
     * @param req The ExpressJS request to look for the token in.
     * @param res The response object to patch the response through to.
     * @param next The method to run if validation is successful.
     */
    verifyToken: (req, res, next) => {
        // check header or url parameters or post parameters for token
        const token = req.headers['x-access-token'] || req.body.token || req.query.token;
        if (!token) return res.status(403).json({auth: false, message: 'No token provided.'});

        // verifies secret and checks exp
        jwt.verify(token, process.env.SECRET_SERVER_ID, (err, decoded) => {
            if (err) return res.status(500).json({auth: false, message: 'Failed to authenticate token.'});

            // if everything is good, save to request for use in other routes
            req.userId = decoded.id;
            next();
        });
    },

  /**
   * Matches against 'Series', 'Series - 2018', 'Series 2018' and 'Series (2018)'
   * @param showTitle
   * @param title
   * @return {boolean}
   */
    isSameSeriesName: (showTitle, title) => {
        let regex = new RegExp(escapeRegExp(showTitle)+'(?: (?:- )?\\(?\\d{4}\\)?)?$', 'gm');
        return regex.test(title);
    },

    /**
     * Escape a regex string.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
     * @param string
     * @return {void | *}
     */
    escapeRegExp: escapeRegExp,

    /**
     * Resolve a url using a base url, the path is already absolute, then nothing is done.
     * @param baseUrl
     * @param path
     * @return {string}
     */
    absoluteUrl: (baseUrl, path) => {
        return url.resolve(baseUrl, path);
    },

    /**
     * Normalize a url in case it's protocol-less.
     * @param link
     * @param defaultScheme
     * @return {*}
     */
    normalizeUrl: (link, defaultScheme = 'http') => {
        if (link.startsWith("//")) {
            link = `${defaultScheme}:${link}`;
        }
        return link;
    },

    /**
     * Creates a promise for setTimeout
     * @param ms The time in miliseconds to wait.
     */
    timeout: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};