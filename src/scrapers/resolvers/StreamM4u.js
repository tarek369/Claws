const rp = require('request-promise');

async function StreamM4u(uri, jar, headers) {
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
}

module.exports = exports = StreamM4u;