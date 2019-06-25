const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneDDL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://www.sceneddl.me/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchTitle = `${title} ${year}`;
            let searchUrl = this._generateUrl(url, { s: searchTitle.replace(/\s/g, '+') });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let foundPages = $('h2.entry-title a').toArray().reduce((returnArray, element) => {
                let foundTitle = $(element).text().toLowerCase();
                let foundPage = $(element).attr('href');

                if (foundTitle.includes(searchTitle)) {
                    returnArray.push(this._absoluteUrl(url, foundPage));
                }

                return returnArray;
            }, []);

            for (let page of foundPages) {
                let pageHTML = await this._createRequest(rp, page, jar, headers);

                $ = cheerio.load(pageHTML);

                let quality = Utils.qualityFromFile($('h1.entry-title').text());

                $('.entry-content p a').toArray().forEach(element => {
                    let link = $(element).attr('href');
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
