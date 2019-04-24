const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class MoviesWeb extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.moviesweb.info/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const season = req.query.season;
        const episode = req.query.episode;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchTitle = `${title} season ${season}`;
            let searchUrl = this._generateUrl(url, { s: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let showPage = '';
            $('.entry-overview .entry-title a').toArray().forEach(element => {
                let contentTitle = $(element).text().toLowerCase();
                let contentPage = $(element).attr('href');

                if (contentTitle.includes(searchTitle)) {
                    showPage = contentPage;
                }
            });
            if (!showPage) {
                return Promise.resolve();
            }

            const showPageHTML = await this._createRequest(rp, showPage, jar, headers);

            $ = cheerio.load(showPageHTML);

            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;

            $(`[href*='${formattedEpisode}' i]`).toArray().forEach(element => {
                const directLink = $(element).attr('href');
                resolvePromises.push(this.resolveLink(directLink, ws, jar, headers, '', { isDDL: true }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
