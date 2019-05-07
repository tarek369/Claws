const cheerio = require('cheerio');
const Utils = require('../../../utils/index')
const BaseProvider = require('../BaseProvider');

module.exports = class PutlockerONL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://ww.putlocker.onl'];
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
        const headers = {};

        try {
            let cleanTitle = title.replace(/(\:|\*|\?|\"|\'|\.|\<|\>|\&|\!|\,)/g, '').replace(/(\/|\s|\-\-)/g, '-');
            let searchUrl = url;
            if (type == 'tv') {
                searchUrl += `/show/${cleanTitle}/season/${season}/episode/${episode}`;
            } else {
                searchUrl += `/movie/${cleanTitle}/watching.html`;
            }
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            $('script').toArray().forEach(element => {
                const raw = $(element).html();
                const matches = raw.match(/SRC="[^"]+"/g)
                if (matches) {
                    matches.forEach(matched => {
                        const link = Utils.normalizeUrl(matched.replace(/(SRC=")|(")/g, ''));
                        resolvePromises.push(this.resolveLink(link, ws, jar, headers, '', { isDDL: false}, hasRD));
                    });
                }
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}