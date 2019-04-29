const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class UltraHDIndir extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://ultrahdindir.com'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const imdb_id = req.query.imdb_id;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchUrl = `${url}/index.php?do=search`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers,
                {
                    method: 'POST',
                    formData: {
                        do: 'search',
                        subaction: 'search',
                        search_start: 0,
                        full_search: 0,
                        result_from: 1,
                        story: imdb_id
                    }
                });

            let $ = cheerio.load(response);

            console.log($.html());

            // .quote a:not([href*='http://ultrahdindir.com'])

            let moviePageArray = $('.box-out').toArray().reduce((returnArray, element) => {
                let foundIMDB = $(element).find(`.news-text a[href*='${imdb_id}']`).attr('href');
                let foundPage = $(element).find('.news-head .news-title a').attr('href');
                
                if (foundIMDB) {
                    returnArray.push(foundPage);
                }

                return returnArray;
            }, []);

            // let isSecondarySearch = false;
            // if (type == 'tv' && moviePageArray.length == 0) {
            //     isSecondarySearch = true;

            //     searchTitle = searchTitle.substr(0, searchTitle.length - 3);
            //     searchUrl = this.generateSearchURL(url, searchTitle);
            //     const secondaryResponse = await this._createRequest(rp, searchUrl, jar, headers);

            //     moviePageArray = this.getSearchResults(searchTitle, year, secondaryResponse);
            // }

            // if (moviePageArray.length == 0) {
            //     return Promise.resolve();
            // }

            // for (let moviePage of moviePageArray) {
            //     let moviePageHTML = await this._createRequest(rp, moviePage, jar, headers);

            //     let $ = cheerio.load(moviePageHTML);

            //     $('.postpage_movie_download_area').toArray().forEach(element => {
            //         let releaseName = $(element).find('.rele_name').text();
            //         if (!isSecondarySearch || (isSecondarySearch && releaseName.includes(`.${season}${paddedEpisode}.`))) {
            //             $(element).find('.anch_multilink a').toArray().forEach(linkElement => {
            //                 let hostLink = $(linkElement).attr('href');
            //                 let quality = Utils.getQualityInfo(releaseName);
            //                 resolvePromises.push(this.resolveLink(hostLink, ws, jar, headers, quality, { isDDL: false }, hasRD));
            //             });
            //         }
            //     });
            // };
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}