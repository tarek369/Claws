const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const { handleRequestError } = require('../../utils/errors');
const Utils = require('../../utils/index');

async function Openload(uri, jar, headers) {
    try {
        let providerPageHtml = await rp({
            uri,
            headers,
            jar,
            followAllRedirects: true,
            timeout: 5000
        });
    
        return OpenloadHtml(providerPageHtml);
    } catch (err) {
        handleRequestError(err, false, "Resolver - OpenLoad");
    }
}

function OpenloadHtml(providerPageHtml) {
    if (!providerPageHtml.includes("We can't find the file you are looking for")) {
        let $ = cheerio.load(providerPageHtml);

        const ogURL = $('meta[name="og:url"]').attr('content');
        const ogTitle = $('meta[name="og:title"]').attr('content');
        let quality = Utils.qualityFromFile(ogURL);
        if (quality == 'HQ') {
            quality = Utils.qualityFromFile(ogTitle);
        }

        let wholeFileId = '';
        const jQuery = function(selector, anotherArg) {
            return {
                $(selector) {
                    return $(selector);
                },
                ready(f) {
                    f();
                },
                text(t) {
                    if (!t) {
                        return $('p').first().text();
                    }
                    wholeFileId = t;
                },
                click() {},
                hide() {},
            }
        };

        // starting variables
        let test = {}
        const sandbox = {
            $: jQuery,
            jQuery,
            document: {
                createTextNode: "function createTextNode() { [native code] }",
                getElementById: "function getElementById() { [native code] }",
                write: "function write() { [native code] }",
                documentElement: {
                    getAttribute(attribute) {
                        return null;
                    }
                }
            },
            cc_cc_cc: null,
            window: {
                $: jQuery,
                jQuery
            },
            sin: Math.sin,
            navigator: {
                userAgent: ''
            },
            ffff: $('p').first().attr('id')
        };
        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext($('script').last()[0].children[0].data, sandbox);

        const sourceUrl = `https://openload.co/stream/${wholeFileId}?mime=true`;
        const isValidUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(sourceUrl);

        if (!isValidUrl) {
            throw 'Openload: URL malformed'
        }

        return { src: sourceUrl, res: quality };
    }

    throw 'Openload: File not found';
}

module.exports = exports = {Openload, OpenloadHtml};