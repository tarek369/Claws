const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');
const vm = require('vm');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');
const {isSameSeriesName} = require('../../../utils');

async function StreamM4u(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const movieTitle = req.query.title;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["http://streamm4u.com"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrapeHarder(url, _token, videoId, headers, jar, title) {
        const resolveSourcesPromises = [];

        try {
            const resolveHiddenLinkUrl = `${url}/anhjax`;
            const iframePageHtml = await rp({
                method: 'POST',
                uri: resolveHiddenLinkUrl,
                formData: {
                    _token,
                    m4u: videoId
                },
                headers,
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(iframePageHtml);

            const providerUrl = $('iframe').attr('src');

            if (!providerUrl) {
                // let setupObject = {};
                // const sandbox = {$(){ return {scrollView(){}}; }, jwplayer(){ return {setup(value){ setupObject = value; }, on(){}}; }};
                // vm.createContext(sandbox); // Contextify the sandbox.
                // vm.runInContext($('script')[0].children[0].data, sandbox);
                // setupObject.sources.forEach(source => {
                //     resolveSourcesPromises.push(resolve(sse, source.file, 'StreamM4u', jar, headers, source.label));
                // });
                // return Promise.all(resolveSourcesPromises);

                const providerUrlRegexResults = /(?:\<iframe\ssrc=")([^"]+)/.exec(iframePageHtml);
                if (providerUrlRegexResults) {
                    return resolve(sse, providerUrlRegexResults[1], 'StreamM4u', jar, headers);
                }
            } else {
                return resolve(sse, providerUrl, 'StreamM4u', jar, headers);
            }
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'StreamM4u', sourceUrl: url, query: {title: req.query.title}, error: err.message || err.toString()});
            }
        }
    }

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            const movieSearchUrl = `${url}/searchJS?term=${movieTitle.replace(/ /g, '+')}`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                'user-agent': userAgent,
            };

            let searchResults = await rp({
                uri: movieSearchUrl,
                headers,
                jar,
                json: true,
                timeout: 5000,
            });

            let searchTitle = searchResults.find(result => isSameSeriesName(movieTitle, result));

            const searchPageHtml = await rp({
                uri: `${url}/search/${searchTitle}`,
                headers,
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(searchPageHtml);


            const streamPageUrl = $(`a .card img[alt^="${searchTitle}"]`).parent().parent().attr('href');
            const quality = $(`a .card img[alt^="${searchTitle}"]`).parent().find('h4').text().split(' - ');

            const streamPageHtml = await rp({
                uri: streamPageUrl,
                headers,
                jar,
                timeout: 5000
            });

            $ = cheerio.load(streamPageHtml);
            const _token = $('meta[name="csrf-token"]').attr('content');

            const resolveHiddenLinkPromises = [];
            $('.le-server span').toArray().forEach((element) => {
                const videoId = $(element).attr('data');
                resolveHiddenLinkPromises.push(scrapeHarder(url, _token, videoId, headers, jar, req.query.title));
            });

            resolvePromises.push(Promise.all(resolveHiddenLinkPromises));
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'StreamM4u', sourceUrl: url, query: {title: req.query.title}, error: err.message || err.toString()});
            }
        }

        return Promise.all(resolvePromises);
    }

    // Asynchronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);
}

module.exports = exports = StreamM4u;