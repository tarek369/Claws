const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class MeliMedia extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://melimedia.net'];
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
            let searchTitle = `${title} ${year}`;
            let searchUrl = this._generateUrl(url, { s: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $('.-title a').toArray().forEach(element => {
                // Replace is used because MeliMedia uses a different apostrophe character...
                let contentTitle = $(element).text().toLowerCase().replace('’', '\'');
                let contentPage = $(element).attr('href');

                if (contentTitle.includes(searchTitle)) {
                    videoPage = contentPage;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('p a').toArray().forEach(element => {
                const directLink = $(element).attr('href');
                const audioRegex = /(.[0-9]{4})(.*)(.Sound)([0-9]*)/;
                if (!audioRegex.test(directLink)) {
                    resolvePromises.push(this.resolveLink(directLink, ws, jar, headers, '', { isDDL: true }, hasRD));
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
