const rp = require('request-promise');
const {handleRequestError} = require('../../utils/errors');

async function StreamM4u(uri, jar, headers) {
    try {
        let response = await rp({
            uri,
            headers,
            jar,
            simple: false,
            resolveWithFullResponse: true,
            followRedirect: false,
            timeout: 5000,
        });
    
        const sourceUrl = response.headers['location'].split('|')[0];
    
        return sourceUrl;
    } catch (err) {
        handleRequestError(err, false, "Resolver - Stream4U");
    }
}

module.exports = exports = StreamM4u;