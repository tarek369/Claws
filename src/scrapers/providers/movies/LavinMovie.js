const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class LavinMovie extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://lavinmovie2.net'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};
    
        try {
            const searchTitle = `${title} ${year}`;
            let searchUrl = this._generateUrl(`${url}/advanced-search/`, { search: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createCloudflareRequest(searchUrl, jar, headers);
            
            let $ = cheerio.load(response);

            let videoPage = '';
            $('.main_info_movie .title_post').toArray().forEach(element => {
                let foundTitle = $(element).find('h2').text().toLowerCase();
                let foundPage = $(element).attr('href');

                if (foundTitle.includes(searchTitle)) {
                    videoPage = foundPage;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createCloudflareRequest(videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('.link_download_a').toArray().forEach(element => {
                let videoLink = $(element).attr('href');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: true }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
