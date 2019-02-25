const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const {absoluteUrl, padTvNumber} = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class Series8 extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www2.seriesonline8.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const showTitle = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {
            'user-agent': randomUseragent.getRandom(),
            'x-real-ip': req.client.remoteAddress,
            'x-forwarded-for': req.client.remoteAddress
        };

        try {
            const searchTitle = showTitle.replace(/\s+/g, '-');
            let searchUrl = (`${url}/movie/search/${searchTitle}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl);
            let $ = cheerio.load(response);

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
            const episodePageHtml = await this._createRequest(rp, episodeLink);

            $ = cheerio.load(episodePageHtml);

            $('.btn-eps').toArray().forEach((iframeLinks) => {
                if ($(iframeLinks).attr('episode-data') === formattedEpisode.toString()) {
                    const link = $(iframeLinks).attr('player-data');
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers));
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
