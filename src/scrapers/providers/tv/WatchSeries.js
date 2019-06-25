const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class WatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://ww3.watch-series.co'];
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
            const searchTitle = `${title} - season ${season}`;
            let searchUrl = this._generateUrl(`${url}/search.html`, { keyword: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            let videoPath = '';
            $('.video_image_container a').toArray().forEach(element => {
                let foundTitle = $(element).attr('title').toLowerCase();
                let foundLink = $(element).attr('href');

                if (foundTitle == searchTitle) {
                    videoPath = foundLink;
                }
            });
            if (!videoPath) {
                return Promise.resolve();
            }

            const episodePage = `${url}/${videoPath}-episode-${episode}`;
            let episodePageHTML = await this._createRequest(rp, episodePage, jar, headers, {}, true);

            $ = cheerio.load(episodePageHTML);

            $('.anime_muti_link li a').toArray().forEach(element => {
                const videoLink = $(element).attr('data-video');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: true }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}
