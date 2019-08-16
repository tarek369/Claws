const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');
const randomUseragent = require('random-useragent');
const createEvent = require('../../../utils/createEvent')

module.exports = class Akoam extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://we.akoam.net'];
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
            let searchUrl = this._generateUrl(`${url}/search/${searchTitle.replace(/ /g, '%20')}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);
            //try to get the first result that has movie name & link
            let videoPage = '';
            $('.tags_box').toArray().some(element => {
                let linkElement = $(element).find('a');

                let contentTitle = $(linkElement).text().trim().toLowerCase();
                let contentPage = $(linkElement).attr('href');
                // ignore if it trailer
                if (contentTitle.includes(searchTitle)) {
                    if (contentTitle.includes('اعلان')) {
                        videoPage = '';
                    } else {
                        videoPage = encodeURI(contentPage);
                        return true;
                    }
                }
            });

            if (!videoPage) {
                console.log(Promise.resolve());
                return Promise.resolve();
            }
            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            let videoLink = [];
            $('.direct_link_box').toArray().forEach(element => {
                videoLink.push($(element).find('.download_btn').first().attr('href'));
            });

            for (const link of videoLink) {
                resolvePromises.push(this.resolveLink(link, ws, jar, headers, '', {isDDL: true}, hasRD));
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
