const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class _300MBFilms extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.300mbfilms.co'];
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


            // Get Cookie For Earn-Money-Onlines
            let authLink = 'http://earn-money-onlines.info/wp-login.php?action=postpass';
            await this._createRequest(rp, authLink, jar, headers, {
                method: 'POST',
                formData: {
                    post_password: '300mbfilms'
                },
            });

            let qualities = [];
            let guidLinks = [];
            $('item').toArray().forEach(element => {
                const itemTitle = $(element).find('title').text();
                const quality = Utils.getQualityInfo(itemTitle);
                const guidLink = $(element).find('guid').text();
                
                qualities.push(quality);
                guidLinks.push(guidLink);
            });


            let qualityIndex = 0;
            for (let providerPage of guidLinks) {
                const providerPageHTML = await this._createRequest(rp, providerPage, jar, headers);
                $ = cheerio.load(providerPageHTML);

                const resolverLink = $('a[href*=earn-money-onlines]').attr('href');
                
                const resolverPageHTML = await this._createRequest(rp, resolverLink, jar, headers);
                $ = cheerio.load(resolverPageHTML);

                const specificQuality = qualities[qualityIndex++];
                $('td a').toArray().forEach(element => {
                    const link = $(element).attr('href');
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers, specificQuality, { isDDL: false }, hasRD));
                });
            }

        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
