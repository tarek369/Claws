const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneDDL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://www.sceneddl.online'];
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
            let searchTitle = `${title.replace(/\s/g, '.')}`
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += `.${formattedEpisode}`;
            } else {
                searchTitle += `.${year}`;
            }
            let searchUrl = `${url}/search/${searchTitle}/feed/rss2/`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('item').toArray().forEach(element => {
                const itemTitle = $(element).find('title').text();

                const feedHTML = $(element).html();
                const videoLinks = feedHTML.match(/url="[^"]*"/g);
                videoLinks.forEach(link => {
                    let videoLink = link.split('"')[1];
                    resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: false}, hasRD));
                });
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
