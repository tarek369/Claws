const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class _300MBDownload extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.300mbdownload.ws'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const imdb_id = req.query.imdb_id;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchUrl = `${url}/search/${imdb_id}/feed/rss2/`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('item').toArray().forEach(element => {
                const itemTitle = $(element).find('title').text();
                const quality = Utils.getQualityInfo(itemTitle);
                $(element).find('p a[target="_blank"]').toArray().forEach(linkElement => {
                    const link = $(linkElement).attr('href');
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
                });
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
