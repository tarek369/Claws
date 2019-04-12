const Promise = require('bluebird');
const cheerio = require('cheerio');
const utils = require('../../../utils/index')
const BaseProvider = require('../BaseProvider');

module.exports = class Onmovies extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://onmovies.se'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {};

        try {
            let searchTitle = `${title}`;
            if (type == 'tv') {
                searchTitle = `${searchTitle} - season ${season}`;
            }
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchUrl = (`${url}/search/${searchTitle.replace(/ /g, '+')}`);
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $(".ml-item a").toArray().forEach(element => {
                let contentLink = $(element).attr('href');
                let contentTitle = $(element).attr('title').toLowerCase();

                if (contentTitle == searchTitle) {
                    videoPage = contentLink;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            let urlParts = videoPage.split('/');
            let contentId = urlParts[urlParts.length - 2];

            let contentInfoUrl = `https://onmovies.se/ajax/mep.php?id=${contentId}`;
            let contentInfoResponse = JSON.parse(await this._createRequest(rp, contentInfoUrl, jar, headers));
            let contentInfoHTML = contentInfoResponse.html;
            $ = cheerio.load(contentInfoHTML);

            let serverList = $('.les-content a').toArray().reduce((returnArray, element) => {
                returnArray.push($(element).attr('data-server'));
                return returnArray;
            }, []);

            let contentType;
            let episodeNumber;
            if (type == 'tv') {
                contentType = type;
                episodeNumber = episode;
            } else {
                contentType = 'film';
                episodeNumber = 1;
            }

            function _uniqueFilter(value, index, self) { 
                return self.indexOf(value) === index;
            }

            for (let server of serverList.filter(_uniqueFilter)) {
                let infoUrl = `https://onmovies.se/ajax/movie_embed.php?mid=${contentId}&epNr=${episodeNumber}&type=${contentType}&server=${server}&epIndex=0&so=5`;
                let infoResponse = JSON.parse(await this._createRequest(rp, infoUrl, jar, headers));
                if (infoResponse.status == 1) {
                    resolvePromises.push(this.resolveLink(infoResponse.src, ws, jar, headers));
                }
            }
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}