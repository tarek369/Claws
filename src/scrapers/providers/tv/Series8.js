const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const { absoluteUrl, getClientIp, removeYearFromTitle } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class Series8 extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www2.seriesonline8.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = getClientIp(req);
        const showTitle = req.query.title.toLowerCase();
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
            const searchTitle = removeYearFromTitle(showTitle).replace(/\s+/g, '-');
            let searchUrl = (`${url}/movie/search/${searchTitle}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl);
            let $ = cheerio.load(response);
            
            const seasonLink = $('.ml-mask').toArray().find((moviePoster) => {
                if (moviePoster.type === 'tag' && moviePoster.name === 'a') {
                    const link = $(moviePoster).attr('href');
                    const title = showTitle.replace(/ /g, '-');
                    return link.includes(`${searchTitle}-season-${season}`);
                }
            });
            if (!seasonLink) {
                this.logger.debug('Series8', `Could not find: ${showTitle} Season ${season}`);
                return Promise.all(resolvePromises);
            }

            const seasonPageLink = absoluteUrl(url, $(seasonLink).attr('href'));
            const episodeLink = `${seasonPageLink}/watching.html?ep=${episode}`;
            const episodePageHtml = await this._createRequest(rp, episodeLink);

            $ = cheerio.load(episodePageHtml);

            const videoUrls = $('.btn-eps').toArray().reduce((providerUrls, iframeLinks) => {
                if ($(iframeLinks).attr('episode-data') === `${episode}`) {
                    providerUrls.push($(iframeLinks).attr('player-data'));
                }
                return providerUrls;
            }, []);

            videoUrls.forEach(async (link) => {
                const headers = {
                    'user-agent': randomUseragent.getRandom(),
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolvePromises.push(this.resolveLink(link, ws, jar, headers));
            });
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}