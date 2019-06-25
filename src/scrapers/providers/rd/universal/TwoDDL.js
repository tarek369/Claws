const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class TwoDDL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://2ddl.vg'];
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
            }
            let searchUrl = this.generateSearchURL(url, searchTitle);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let moviePageArray = this.getSearchResults(searchTitle, year, response);

            let isSecondarySearch = false;
            if (type == 'tv' && moviePageArray.length == 0) {
                isSecondarySearch = true;

                searchTitle = searchTitle.substr(0, searchTitle.length - 3);
                searchUrl = this.generateSearchURL(url, searchTitle);
                const secondaryResponse = await this._createRequest(rp, searchUrl, jar, headers);

                moviePageArray = this.getSearchResults(searchTitle, year, secondaryResponse);
            }

            if (moviePageArray.length == 0) {
                return Promise.resolve();
            }

            for (let moviePage of moviePageArray) {
                let moviePageHTML = await this._createRequest(rp, moviePage, jar, headers);

                let $ = cheerio.load(moviePageHTML);

                $('.postpage_movie_download_area').toArray().forEach(element => {
                    let releaseName = $(element).find('.rele_name').text();
                    if (!isSecondarySearch || (isSecondarySearch && releaseName.includes(`.${season}${paddedEpisode}.`))) {
                        $(element).find('.anch_multilink a').toArray().forEach(linkElement => {
                            let hostLink = $(linkElement).attr('href');
                            let quality = Utils.qualityFromFile(releaseName);
                            resolvePromises.push(this.resolveLink(hostLink, ws, jar, headers, quality, { isDDL: false }, hasRD));
                        });
                    }
                });
            };
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }

    generateSearchURL(url, searchTitle) {
        let searchUrl = this._generateUrl(`${url}/`, {
            s: '',
            title: searchTitle.replace(/ /g, '+')
        });
        return searchUrl;
    }

    getSearchResults(searchTitle, year, response) {
        let $ = cheerio.load(response);

        let foundYears = $('dd a[href*=year]').toArray();
        let yearIndex = 0;

        let moviePageArray = $('div.postpage_movie_header h2 a').toArray().reduce((returnArray, element) => {
            let foundTitle = $(element).text().toLowerCase();
            let foundYear = $(foundYears[yearIndex++]).text();
            let foundPage = $(element).attr('href');

            if (foundTitle.includes(searchTitle) && foundYear == year) {
                returnArray.push(foundPage);
            }

            return returnArray;
        }, []);

        return moviePageArray;
    }
}