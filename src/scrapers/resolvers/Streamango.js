const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const normalizeUrl = require('../../utils').normalizeUrl;
const { handleRequestError } = require('../../utils/errors');
const Utils = require('../../utils/index');

async function Streamango(uri, jar, headers) {
    try {
        let providerPageHtml = await rp({
            uri,
            headers,
            jar,
            timeout: 5000
        });

        return StreamangoHtml(providerPageHtml);
    } catch (err) {
        handleRequestError(err, false, "Resolver - Streamango");
    }
}

function StreamangoHtml(providerPageHtml) {
    let $ = cheerio.load(providerPageHtml);

    const ogURL = $('meta[name="og:url"]').attr('content');
    const ogTitle = $('meta[name="og:title"]').attr('content');
    let quality = Utils.qualityFromFile(ogURL);
    if (quality == 'HQ') {
        quality = Utils.qualityFromFile(ogTitle);
    }

    const jQuery = function (selector, anotherArg) {
        return {
            $(selector) {
                return $(selector);
            },
            ready(f) {
                f();
            },
            click() { },
            hide() { }
        }
    };

    // starting variables
    const sandbox = {
        $: jQuery,
        document: {},
        window: {},
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains(srces)')[0].children[0].data.replace('src:d(', 'src:window.d('), sandbox);

    return { src: normalizeUrl(sandbox.srces[0].src, 'https'), res: quality };

}

module.exports = exports = { Streamango, StreamangoHtml };