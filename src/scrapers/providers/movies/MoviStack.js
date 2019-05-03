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
        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Host': 'www.movistack.com',
            'If-None-Match': '0f96613235062963ccde717b18f97592',
            'Upgrade-Insecure-Requests': 1,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
        };

        try {
            const searchUrl = this._generateUrl(`${url}/api/search`, { q: title });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, { json: true });

            console.log(response);

            // let searchJSON = JSON.parse(response);

            // const movieId = '';
            // for (let result of searchJSON.results) {
            //     const foundTitle = result.title.toLowerCase();
            //     const releaseDate = result.release_date;

            //     if (foundTitle == title && releaseDate.includes(year)) {
            //         movieId = result.id;
            //     }
            // }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
