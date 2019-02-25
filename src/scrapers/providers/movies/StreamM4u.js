const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');
const {isSameSeriesName} = require('../../../utils');

async function StreamM4u(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const movieTitle = req.query.title;
    const year = (new Date(req.query.release_date)).getFullYear();

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
                const providerUrlRegexResults = /(?:\<iframe\ssrc=")([^"]+)/.exec(iframePageHtml);
                if (providerUrlRegexResults) {
                    return resolve(sse, providerUrlRegexResults[1], 'StreamM4u', jar, headers);
                }
            } else {
                return resolve(sse, providerUrl, 'StreamM4u', jar, headers);
            }
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'StreamM4u', sourceUrl: url, query: {title: req.query.title}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }
    }

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            const headers = {
                'user-agent': userAgent,
            };

            const searchPageHtml = await rp({
                uri: `${url}/search/${movieTitle.replace(/[^a-zA-Z0-9]+/g, '-')}`,
                headers,
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(searchPageHtml);


            let searchResult = $(`a .card img[alt^="${movieTitle} (${year})"]`);
            if (!searchResult.length) {
                searchResult = $(`a .card img[alt^="${movieTitle} ${year}"]`);
                if (!searchResult.length) {
                    searchResult = $(`a .card img[alt^="${movieTitle}"]`);
                }
            }
            if (!searchResult.length) {
                return Promise.resolve();
            }
            const streamPageUrl = searchResult.parent().parent().attr('href');
            const quality = searchResult.parent().find('h4').text().split(' - ');

            const streamPageHtml = await rp({
                uri: streamPageUrl,
                headers,
                jar,
                timeout: 5000
            });

            $ = cheerio.load(streamPageHtml);
            const _token = $('meta[name="csrf-token"]').attr('content');

            $('.le-server span').toArray().forEach((element) => {
                const videoId = $(element).attr('data');
                resolvePromises.push(scrapeHarder(url, _token, videoId, headers, jar, req.query.title));
            });
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'StreamM4u', sourceUrl: url, query: {title: req.query.title}, error: (err.message || err.toString()).substring(0, 100) + '...'});
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
