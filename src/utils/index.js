// Import dependencies
const url = require('url');

const jwt = require('jsonwebtoken');

// Define utility functions.
let escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

// Valid file extensions for DDL providers
const validExtensions = [ 'mkv', 'mp4', 'avi' ];

module.exports = {
    /**
     * Used to pad the series and episode numbers.
     * e.g. converts '1' to '01'.
     * @param value The number to pad.
     * @returns {string} The padded string.
     */
    padTvNumber: (value) => Number(value) < 10 ? `0${value}` : value,

    /**
     * Validates a request token in a WebSocket request.
     * @param token The token to verify.
     */
    verifyToken: async (token) => {
        // check header or url parameters or post parameters for token
        if (!token) {
            return {auth: false, message: 'No token provided.'};
        }

        // verifies secret and checks exp
        return new Promise((resolve) => {
            jwt.verify(token, process.env.SECRET_CLIENT_ID, (err, decoded) => {
                if (err) {
                    return resolve({auth: false, message: 'Failed to authenticate token.'});
                }

                // if everything is good, save to request for use in other routes
                // req.userId = decoded.id;
                resolve({auth: true});
            });
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
    },

    /**
     * removes year from string ie: title (2019) -> title
     * @param title title including year to be removed.
     */
    removeYearFromTitle: (title) => {
        return title.replace(/\s\([0-9]{4}\)$/, "");
    },

    /**
     * Checks if DDL link/file has a valid video extension
     * @param file DDL file/link.
     */
    hasValidExtension: (file) => {
        const splitString = file.split('.');
        const extension = splitString[splitString.length - 1].toLowerCase();
        if (validExtensions.includes(extension)){
            return true;
        } else {
            return false;
        }
    },

    /**
     * Tries to extract quality information from a given filename
     * @param filename The name of the file.
     */
    getQualityInfo: (filename) => {
        filename = decodeURI(filename.toLowerCase());

        if (/([^a-zA-Z0-9])(2160p?)([^a-zA-Z0-9])/g.test(filename)) {
            return 2160;
        } else if (/([^a-zA-Z0-9])(1080p?)([^a-zA-Z0-9])/g.test(filename)) {
            return 1080;
        } else if (/([^a-zA-Z0-9])(720p?|brrip|\.hd\.)([^a-zA-Z0-9])/g.test(filename)) {
            return 720;
        } else if (/([^a-zA-Z0-9])(480p?)([^a-zA-Z0-9])/g.test(filename)) {
            return 480;
        } else if (/([^a-zA-Z0-9])(dvdscr|r5|r6)([^a-zA-Z0-9])/g.test(filename)) {
            return 450;
        } else if (/([^a-zA-Z0-9])(360p?)([^a-zA-Z0-9])/g.test(filename)) {
            return 360;
        } else if (/([^a-zA-Z0-9])(camrip|tsrip|hdcam|hdts|dvdcam|dvdts|cam|telesync|ts)([^a-zA-Z0-9])/g.test(filename)) {
            return 300;
        } else {
            return 0;
        }
    }
};