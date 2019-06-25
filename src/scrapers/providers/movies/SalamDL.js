const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class SalamDL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://salamdl.info/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchTitle = `${title} ${year}`;
            let searchUrl = this._generateUrl(url, { s: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $('article h2 a').toArray().forEach(element => {
                let contentTitle = $(element).attr('title').toLowerCase();
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

            $('#linkbox li a').toArray().forEach(element => {
                let videoLink = $(element).attr('href');
                if (!videoLink.toLowerCase().includes('trailer') && !videoLink.toLowerCase().includes('teaser')
                    && !videoLink.toLowerCase().includes('dubbed')) {
                    resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: true }, hasRD));
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
