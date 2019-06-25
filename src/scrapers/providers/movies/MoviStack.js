const BaseProvider = require('../BaseProvider');
const Utils = require('../../../utils/index');

module.exports = class MoviStack extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.movistack.com'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        const headers = {};

        try {
            let searchUrl = this._generateUrl(`${url}/api/search`, { q: title });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            let response = await this._createRequest(rp, searchUrl, jar, headers, {}, false, true);

            let searchJSON = JSON.parse(response);

            let movieId = '';
            for (let result of searchJSON.results) {
                const foundTitle = result.title.toLowerCase();
                const releaseDate = result.release_date;

                if (foundTitle == title && releaseDate.includes(year)) {
                    movieId = result.id;
                    break;
                }
            }
            if (!movieId) {
                return Promise.resolve();
            }

            searchUrl = `${url}/api/get-movie/links/${movieId}`;
            response = await this._createRequest(rp, searchUrl, jar, headers, {}, false, true);

            searchJSON = JSON.parse(response);

            for (let movieLink of searchJSON.movieLinks) {
                const directLink = movieLink.url + movieLink.href;
                const quality = Utils.qualityFromFile(movieLink.href);
                resolvePromises.push(this.resolveLink(directLink, ws, jar, headers, quality, { isDDL: true }, hasRD));
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}