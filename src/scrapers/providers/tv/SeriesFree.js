const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

const resolve = require('../../resolvers/resolve');
const {isSameSeriesName} = require('../../../utils');
const logger = require('../../../utils/logger');

async function SeriesFree(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const showTitle = req.query.title;
    const {season, episode, year} = req.query;

    // These providers were in the Terarium source, but are now dead..... We need to find others
    // https://seriesfree1.bypassed.bz, https://seriesfree1.bypassed.eu, https://seriesfree1.bypassed.bz

    const urls = ["https://seriesfree.to"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrapeHarder(videoUrl, userAgent, clientIp, sse, jar) {
        try {
            const videoPageHtml = await rp({
                uri: videoUrl,
                headers: {
                    'user-agent': userAgent
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(videoPageHtml);

            const providerUrl = $('.action-btn').attr('href');

            const headers = {
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };
            return resolve(sse, providerUrl, 'SeriesFree', jar, headers);
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'SeriesFree', sourceUrl: videoUrl, query: {title: req.query.title, season: req.query.season, episode: req.query.episode}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }
    }

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            const html = await rp({
                uri: `${url}/search/${showTitle.replace(/ \(.*\)/, '').replace(/ /, '%20')}`,
                headers: {
                    'user-agent': userAgent
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            let showUrl = '';
            $('.serie-title').toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})` || $(element).text() === showTitle) {
                    showUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            if (!showUrl) {
                return Promise.resolve();
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

            let episodeUrl;
            $('.sinfo').toArray().some(element => {
                if ($(element).text() === `${season}×${episode}`) {
                    episodeUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            if (!episodeUrl) {
                logger.debug('SeriesFree', `Could not find: ${showTitle} ${season}×${episode}`);
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

            const videoUrls = $('.watch-btn').toArray().map(element => `${url}${$(element).attr('href')}`);

            videoUrls.forEach((videoUrl) => {
                resolvePromises.push(scrapeHarder(videoUrl, userAgent, clientIp, sse, jar));
            });
        } catch (err) {
            if (!sse.stopExecution) {
              logger.error({source: 'SeriesFree', sourceUrl: url, query: {title: req.query.title, season: req.query.season, episode: req.query.episode}, error: (err.message || err.toString()).substring(0, 100) + '...'});
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

module.exports = exports = SeriesFree;
