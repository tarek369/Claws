const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class MaxRelease extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://max-rls.com/'];
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
            let searchUrl = this._generateUrl(url, { s: searchTitle, submit: 'Find' });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('#contentArea .post').toArray().forEach(postElement => {
                const postTitle = $(postElement).find('.postTitle a').text().toLowerCase();
                const postQuality = Utils.qualityFromFile(postTitle);

                if (postTitle.includes(searchTitle)) {
                    $(postElement).find('.postContent a').toArray().forEach(linkElement => {
                        const link = $(linkElement).attr('href');
                        if (!link.includes('youtube.com')) {
                            resolvePromises.push(this.resolveLink(link, ws, jar, headers, postQuality, { isDDL: false }, hasRD));
                        }
                    });
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
