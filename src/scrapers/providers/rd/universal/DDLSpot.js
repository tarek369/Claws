const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class DDLSpot extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://www.ddlspot.com'];
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
            let searchTitle = `${title}`;
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += ` ${formattedEpisode}`;
            } else {
                searchTitle += ` ${year}`;
            }
            let searchUrl = this._generateUrl(`${url}/search/`, { q: searchTitle, m: 1, x: 0, y: 0 });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let contentType = 'tv';
            if (type == 'movies') {
                contentType = 'movie';
            }

            let foundPages = $('.row').toArray().reduce((returnArray, element) => {
                let foundTitle = $(element).find('a').attr('title').toLowerCase();
                let foundPage = $(element).find('a').attr('href');
                let foundType = $(element).find('td:nth-child(3)').text().toLowerCase();

                if (foundTitle.includes(searchTitle) && foundType == contentType) {
                    returnArray.push(this._absoluteUrl(url, foundPage));
                }

                return returnArray;
            }, []);

            for (let page of foundPages) {
                let pageHTML = await this._createRequest(rp, page, jar, headers);

                $ = cheerio.load(pageHTML);

                $('div.dl-links a').toArray().forEach(element => {
                    let link = $(element).attr('href').split('\'')[1];
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