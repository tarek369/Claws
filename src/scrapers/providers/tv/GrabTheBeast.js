const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');
const Utils = require('../../../utils/index');

module.exports = class GrabTheBeast extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://grabthebeast.com/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchUrl = (`${url}/search/${title.replace(' ', '%20')}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let showId = '';
            $('.search_about').toArray().forEach(element => {
                let linkElement = $(element).find('.search_name a');
                let foundId = linkElement.attr('href').split('/').pop();
                let showTitle = linkElement.text().toLowerCase();

                if (showTitle == title) {
                    showId = foundId;
                }
            });
            if (!showId) {
                return Promise.resolve();
            }

            const episodePage = `${url}/stream/${showId}/season/${season}/episode/${episode}`;
            let episodePageHTML = await this._createRequest(rp, episodePage, jar, headers);

            $ = cheerio.load(episodePageHTML);

            $('video source').toArray().forEach(element => {
                const videoLink = $(element).attr('src');
                const quality = Utils.getQualityInfo($(element).attr('size'));
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, quality, { isDDL: true }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}
