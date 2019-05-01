const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneRelease extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://scene-rls.net/', 'http://scene-rls.com/'];
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
            let searchUrl = this._generateUrl(`${url}/`, { s: searchTitle.replace(' ', '+'), submit: 'Find' });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            // $('.post').toArray().forEach(element => {
            //     let foundTitle = $(element).find('.postTitle a').text().toLowerCase();
            //     console.log(foundTitle);
            // });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
