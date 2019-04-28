const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class MyVideoLinks extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://myvideolinks.net/vv/'];
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
        let headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };

        try {
            let searchTitle = `${title}`;
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += ` ${formattedEpisode}`;
            } else {
                searchTitle += ` ${year}`;
            }
            let searchUrl = this._generateUrl(url, { s: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let foundPages = $('.post-info h2 a').toArray().reduce((returnArray, element) => {
                let foundTitle = $(element).attr('title').toLowerCase();
                let foundPage = $(element).attr('href');

                if (foundTitle.includes(searchTitle)) {
                    returnArray.push(this._absoluteUrl(url, foundPage));
                }

                return returnArray;
            }, []);

            for (let page of foundPages) {
                let pageHTML = await this._createRequest(rp, page, jar, headers);

                $ = cheerio.load(pageHTML);

                $('.post-content ul li a').toArray().forEach(element => {
                    let link = $(element).attr('href');
                    let quality = Utils.getQualityInfo(link);
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}