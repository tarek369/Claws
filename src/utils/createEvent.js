const URL = require('url');
const uuid = require('uuid/v4');

function createEvent(data, ipLocked, pairing, { quality, provider, source, isResultOfScrape = false, cookieRequired = '', cookie = '', isDDL = false, hasRD = false }, headers) {
    if (hasRD) {
        return {
            event: 'RDScrape',
            target: data,
            provider,
            resolver: source,
            quality
        };
    }
    
    if (ipLocked) {
        return {
            event: 'scrape',
            target: pairing.target,
            headers,
            provider,
            resolver: source,
            cookieRequired,
            scrapeId: uuid()
        }
    }

    return {
        event: 'result',
        file: {
            data,
        },
        isResultOfScrape,
        metadata: {
            quality,
            provider,
            source,
            cookie,
            isDDL
        },
        headers
    };
}

module.exports = exports = createEvent;
