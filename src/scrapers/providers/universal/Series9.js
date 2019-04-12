const Promise = require('bluebird');
const cheerio = require('cheerio');
const utils = require('../../../utils/index')
const BaseProvider = require('../BaseProvider');

module.exports = class Series9 extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://series9.io'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {};

        try {
            let searchUrlBase = 'https://api.ocloud.stream/series/movie/search/';
            let searchTitle = title.replace(/[^a-zA-Z0-9]/g, '-');
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchUrl = `${searchUrlBase}${searchTitle}?link_web=${encodeURIComponent(url)}`;
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $(".ml-item a").toArray().forEach(element => {
                let contentLink = $(element).attr('href');
                let contentTitle = $(element).attr('title').toLowerCase();

                let compareTitle = title;
                if (type == 'tv') {
                    compareTitle += ` - season ${season}`;
                }

                if (compareTitle == contentTitle) {
                    videoPage = `${contentLink}/watching.html`;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            let episodeInfo = 0;
            if (type == 'tv') {
                episodeInfo = episode;
            }

            $('.les-content a').toArray().forEach(element => {
                let episodeData = $(element).attr('episode-data');
                if (episodeInfo == episodeData) {
                    let videoLink = utils.normalizeUrl($(element).attr('player-data'));
                    resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers));
                }
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}