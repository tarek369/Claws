const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class MoviesWBB extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://movieswbb.net/'];
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
                searchTitle += ` (${year})`;
            }
            let searchUrl = this._generateUrl(url, { s: searchTitle });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let foundPages = $('.topBlog h2 a').toArray().reduce((returnArray, element) => {
                const foundTitle = $(element).text().toLowerCase();
                if (foundTitle.includes(searchTitle)) {
                    const foundLink = $(element).attr('href');
                    returnArray.push(foundLink);
                }

                return returnArray;
            }, []);

            for (let page of foundPages) {
                let pageHTML = await this._createRequest(rp, page, jar, headers);

                $ = cheerio.load(pageHTML);

                const postTitle = $('.post-title a').text().toLowerCase();

                $('p a span span strong').toArray().forEach(element => {
                    const link = $(element).closest('a').attr('href');
                    resolvePromises.push(this.resolveLink(link, ws, jar, headers, '', { isDDL: false }, hasRD));
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
