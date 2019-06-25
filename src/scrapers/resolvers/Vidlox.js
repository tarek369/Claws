const rp = require('request-promise');
const {handleRequestError} = require('../../utils/errors');

async function Vidlox(uri, jar, headers) {
    try {
        const videoSourceHtml = await rp({
            uri,
            headers,
            jar,
            timeout: 5000
        });
        let result;
        result = JSON.parse(/(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1]);
        return result
    }
    catch (err) {
        handleRequestError(err, false, "Resolver - Vidlox");
    }
}

module.exports = exports = Vidlox;