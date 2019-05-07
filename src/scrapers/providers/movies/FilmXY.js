const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class FilmXY extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.filmxy.ws/'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};
    
        try {
            const searchTitle = `${title} (${year})`;
            let category = '';
            if (/[a-z]/g.test(searchTitle.charAt(0))) {
                category = searchTitle.charAt(0);
            } else {
                category = '1';
            }
            let searchUrl = `${url}movie-list/${category}/`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);
            
            let $ = cheerio.load(response);

            let videoPage = '';
            $('div p a').toArray().forEach(element => {
                let foundTitle = $(element).text().toLowerCase();
                let foundPage = $(element).attr('href');

                if (foundTitle.includes(searchTitle)) {
                    videoPage = foundPage;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('.tab-content #tab-stream a').toArray().forEach(element => {
                const videoFrame = $(element).attr('data-player');
                const cElement = cheerio.load(videoFrame);
                const videoLink = cElement('iframe').attr('src');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: false }, hasRD));
            });

            if (hasRD) {
                const linkBin = $('.tab-content #tab-download a').attr('href');
                const linkBinHTML = await this._createRequest(rp, linkBin, jar, headers);

                $ = cheerio.load(linkBinHTML);

                $('.click-link').toArray().forEach(element => {
                    const rdLink = $(element).attr('href');
                    resolvePromises.push(this.resolveLink(rdLink, ws, jar, headers, '', { isDDL: false }, hasRD));
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
