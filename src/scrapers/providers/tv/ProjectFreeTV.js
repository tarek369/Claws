const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class ProjectFreeTV extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www9.project-free-tv.ag'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const season = req.query.season;
        const episode = req.query.episode;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {
            'Referer': url
        };

        try {
            let searchTitle = `${title} season ${season}`;
            const searchUrl = this._generateUrl(`${url}/search-tvshows/`, { free: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let seasonPage = '';
            $('table td a').toArray().forEach(element => {
                let foundLink = $(element).attr('href');
                let foundTitle = $(element).text().toLowerCase();
    
                if (foundTitle == searchTitle) {
                    seasonPage = url + foundLink.replace('watch-', '');
                }
            });
            if (!seasonPage) {
                return Promise.resolve();
            }

            let seasonPageHTML = await this._createRequest(rp, seasonPage, jar, headers);

            $ = cheerio.load(seasonPageHTML);

            searchTitle += ` episode ${episode}`;

            let videoPage = '';
            $('table td a').toArray().forEach(element => {
                let foundLink = $(element).attr('href');
                let foundTitle = $(element).text().toLowerCase();
    
                if (foundTitle == searchTitle) {
                    videoPage = foundLink;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('table td a[onclick]').toArray().forEach(element => {
                const clickScript = $(element).attr('onclick');
                const videoLink = clickScript.match(/https?:\/\/.+\'\)\;/g)[0].split('\'')[0];
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: false}, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}
