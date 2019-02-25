const Promise = require('bluebird');
const URL = require('url');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const tough = require('tough-cookie');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');
const {absoluteUrl, padTvNumber} = require('../../../utils');

async function Series8(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const showTitle = req.query.title.toLowerCase();
    const year = req.query.year;
    const {season, episode} = req.query;

    const urls = ['https://www2.seriesonline8.co'];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url) {
        const resolvePromises = [];

        try {
            var jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            const html = await rp({
                uri: `${url}/movie/search/${showTitle.replace(/\s+/g, '-')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            const escapedShowTitle = showTitle.replace(/[^a-zA-Z0-9]+/g, '-');
            let isPadded = true;
            const paddedSeason = padTvNumber(season);
            let linkText = `${escapedShowTitle}-${year}-season-${paddedSeason}`;
            let seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
            if (!seasonLinkElement.length) {
                isPadded = false;
                linkText = `${escapedShowTitle}-${year}-season-${season}`;
                seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                if (!seasonLinkElement.length) {
                    isPadded = true;
                    linkText = `${escapedShowTitle}-season-${paddedSeason}`;
                    seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                    if (!seasonLinkElement.length) {
                        isPadded = false;
                        linkText = `${escapedShowTitle}-season-${season}`;
                        seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                    }
                }
            }
            if (!seasonLinkElement.length) {
                // No season link.
                logger.debug('Series8', `Could not find: ${showTitle} (${year}) Season ${season}`);
                return Promise.resolve();
            }

            const seasonPageLink = absoluteUrl(url, `/film/${linkText}`);

            const formattedEpisode = isPadded ? padTvNumber(episode) : episode;
            const episodeLink = `${seasonPageLink}/watching.html`;

            const episodePageHtml = await rp({
                uri: episodeLink,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const headers = {
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };
            const videoUrls = $('.btn-eps').toArray().forEach((iframeLinks) => {
                if ($(iframeLinks).attr('episode-data') === formattedEpisode.toString()) {
                    const provider = $(iframeLinks).attr('player-data');
                    resolvePromises.push(resolve(sse, provider, 'Series8', jar, headers));
                }
            });
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'Series8', sourceUrl: url, query: {title: req.query.name, season: req.query.season, episode: req.query.episode}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }

        return Promise.all(resolvePromises);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = Series8;