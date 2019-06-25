const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneRelease extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://scene-rls.net/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchTitle = title.replace(':', '');
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += ` ${formattedEpisode}`;
            } else {
                searchTitle += ` ${year}`;
            }
            let searchUrl = this._generateUrl(url, { s: searchTitle.replace(/\s/g, '+'), submit: 'Find' });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true, true);

            let $ = cheerio.load(response);

            $('.post').toArray().forEach(postElement => {
                const postTitle = $(postElement).find('.postTitle a').text().toLowerCase();
                if (postTitle.includes(searchTitle)) {
                    $(postElement).find('.postContent h2 a').toArray().forEach(linkElement => {
                        const link = $(linkElement).attr('href');
                        let quality = Utils.qualityFromFile(postTitle);
                        resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
                    });
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
