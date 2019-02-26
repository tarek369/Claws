const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const URL = require('url');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');

async function SwatchSeries(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '')
    const showTitle = req.query.title;
    const {season, episode, year} = req.query;

    const urls = ["https://www1.swatchseries.to"];
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
            const userAgent = randomUseragent.getRandom();
            const html = await rp({
                uri: `${url}/search/${showTitle.replace(/ \(.*\)/, '').replace(/ /, '%20')}`,
                headers: {
                    'user-agent': userAgent,
                    referer: url
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            let showUrl = '';

            $(`a strong`).toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})` || $(element).text() === `${showTitle} (${year}) (${year})` || $(element).text() === showTitle) {
                    showUrl = $(element).parent().attr('href');
                    return true;
                }
                return false;
            });

            if (!showUrl) {
                // Don't attempt to make requests on empty URLs.
                return Promise.all(resolvePromises);
            }

            const videoPageHtml = await rp({
                uri: showUrl,
                headers: {
                    'user-agent': userAgent
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHtml);

            // const episodeUrl = $(`a[href*="s${season}_e${episode}.html"]`).attr('href');
            let episodeUrl = '';
            $(`div[itemtype="http://schema.org/TVSeason"]`).toArray().some(seasonDiv => {
                const seasonSpan = $(seasonDiv).find('a[itemprop="url"] > span[itemprop="name"]');
                if (seasonSpan.length && seasonSpan.text() === `Season ${season}`) {
                    const episodeListItem = $(seasonDiv).find(`li[itemtype="http://schema.org/TVEpisode"]:has(meta[itemprop="episodenumber"][content="${episode}"])`);
                    episodeUrl = episodeListItem.find('a').attr('href');
                    return true;
                }

                return false;
            });

            if (!episodeUrl) {
                return Promise.resolve();
            }

            const episodePageHtml = await rp({
                uri: episodeUrl,
                headers: {
                    'user-agent': userAgent
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const videoUrls = $('.watchlink').toArray().map(element => URL.parse($(element).attr('href') || '', true).query.r).filter(url => !!url).map(url => Buffer.from(url, 'base64').toString());

            videoUrls.forEach((providerUrl) => {
                const headers = {
                    'user-agent': userAgent,
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolvePromises.push(resolve(sse, providerUrl, 'SwatchSeries', jar, headers));
            });
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'SwatchSeries', sourceUrl: url, query: {title: req.query.name, season: req.query.season, episode: req.query.episode}, error: (err.message || err.toString()).substring(0, 100) + '...'});
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

module.exports = exports = SwatchSeries;
