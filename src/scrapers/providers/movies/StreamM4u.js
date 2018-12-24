const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');

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

            let searchTitle = searchResults.find(result => isSameSeriesName(movieTitle, result) === movieTitle);

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

            $('.le-server span').toArray().forEach((element) => {
                const providerUrl = `${url}/view.php?v=${$(element).attr('data')}`;
                resolvePromises.push(resolve(sse, providerUrl, 'StreamM4u', jar, headers));
            });
        } catch (err) {
            if (!sse.stopExecution) {
                console.error({source: 'StreamM4u', sourceUrl: url, query: {title: req.query.title}, error: err.message || err.toString()});
            }
        }

        return Promise.all(resolvePromises);
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);
}

module.exports = exports = StreamM4u;