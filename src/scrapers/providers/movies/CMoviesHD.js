const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class CMoviesHD extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://cmovieshd.net'];
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
            let searchUrl = this._generateUrl(`${url}/search/`, { q: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);
            
            let $ = cheerio.load(response);
            
            let videoPage = '';
            let posterElements = $('.ml-item a').toArray();
            for (let posterElement of posterElements) {
                let contentTitle = $(posterElement).attr('title').toLowerCase();
                let contentPage = $(posterElement).attr('href');

                if (contentTitle.includes(title)) {
                    videoPage = `${contentPage}watch/`;
                    break;
                }
            }
            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers, {}, true);

            $ = cheerio.load(videoPageHTML);

            let embedPages = [];
            $('#content-embed').toArray().forEach(element => {
                let frameHTML = $(element).html();
                let frameLinks = frameHTML.match(/src="[^"]*"/g);
                frameLinks.forEach(link => {
                    let formattedLink = link.split('"')[1].replace('load_player.html?e=', 'episode/embed/');
                    embedPages.push(formattedLink);
                });
            });
            if (embedPages.length == 0) {
                return Promise.resolve();
            }
            
            for (let embedPage of embedPages) {
                const embedResponse = await this._createRequest(rp, embedPage, jar, headers, {}, true);
                const json = JSON.parse(embedResponse);
    
                if (json.status == 1) {
                    resolvePromises.push(this.resolveLink(json.embed, ws, jar, headers, '', { isDDL: false}, hasRD));
                }
            };
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
