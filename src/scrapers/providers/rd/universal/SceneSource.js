const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneSource extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.scnsrc.me/'];
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
        let headers = {
            'Referer': url
        };

        try {
            let searchTitle = `${title.replace(':', '')}`;
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += ` ${formattedEpisode}`;
            } else {
                searchTitle += ` ${year}`;
            }
            let searchUrl = this._generateUrl(url, { s: searchTitle.replace(' ', '+'), m: 1, x: 0, y: 0 });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            let foundPages = $('.post h2 a').toArray().reduce((returnArray, element) => {
                let foundTitle = $(element).attr('title').toLowerCase();
                console.log(foundTitle);
                let foundPage = $(element).attr('href');

                if (foundTitle.includes(searchTitle) && foundType == contentType) {
                    returnArray.push(this._absoluteUrl(url, foundPage));
                }

                return returnArray;
            }, []);

            // for (let page of foundPages) {
            //     let pageHTML = await this._createRequest(rp, page, jar, headers);

            //     $ = cheerio.load(pageHTML);

            //     $('div.dl-links a').toArray().forEach(element => {
            //         let link = $(element).attr('href').split('\'')[1];
            //         let quality = Utils.getQualityInfo(link);
            //         resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
            //     });
            // }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
