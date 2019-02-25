const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const URL = require('url');
const { absoluteUrl, removeYearFromTitle } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class SwatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["https://www1.swatchseries.to"];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const showTitle = req.query.title;
        const year = req.query.year;
        const season = req.query.season
        const episode = req.query.episode;
        const searchTitle = showTitle.replace(/\s+/g, '%20').toLowerCase();
        const searchUrl = `${url}/search/${searchTitle}`;
        const rp = this._getRequest(req, ws);
        const jar = rp.jar();
        const resolvePromises = [];
        const clientIp = this._getClientIp(req);

        try {
            const response = await this._createRequest(rp, searchUrl, jar, {
                'user-agent': randomUseragent.getRandom(),
                referer: url
            });
            let $ = cheerio.load(response);
            let showUrl = '';
            $(`a strong`).toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})`) {
                    showUrl = $(element).parent().attr('href');
                    return true;
                }
                return false;
            });

            if (!showUrl) {
                // Don't attempt to make requests on empty URLs.
                this.logger.debug(`${this.getProviderId()} - no urls found for ${showTitle}`)
                return Promise.all(resolvePromises);
            }
            const videoPageHtml = await this._createRequest(rp, showUrl);

            $ = cheerio.load(videoPageHtml);
            const episodeUrl = $(`a[href*="s${season}_e${episode}."]`).attr('href');
            const episodePageHtml = await this._createRequest(rp, episodeUrl);

            $ = cheerio.load(episodePageHtml);
            const videoUrls = $('.watchlink').toArray().map(element => URL.parse($(element).attr('href') || '', true).query.r).filter(url => !!url).map(url => Buffer.from(url, 'base64').toString());
            videoUrls.forEach(async (link) => {
                const headers = {
                    'user-agent': randomUseragent.getRandom(),
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolvePromises.push(this.resolveLink(link, ws, jar, headers));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}