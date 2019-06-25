const cheerio = require('cheerio');
const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');

module.exports = class SceneSource extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://www.scenesource.me/'];
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
            'Referer': url,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36'
        };

        try {
            let searchTitle = title.replace(':', '');
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            if (type == 'tv') {
                searchTitle += ` ${formattedEpisode}`;
            } else {
                searchTitle += ` ${year}`;
            }
            let searchUrl = this._generateUrl(url, { s: searchTitle, x: 0, y: 0 });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            let response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            let foundPages = $('.post h2 a').toArray().reduce((returnArray, element) => {
                const foundTitle = $(element).attr('title').toLowerCase().replace(/<u>|<\/u>/g, '');
                const foundLink = $(element).attr('href');
                
                if (foundTitle.includes(searchTitle)) {
                    returnArray.push(foundLink);
                }

                return returnArray;
            }, []);

            if (type == 'tv' && foundPages.length == 0) {
                searchTitle = searchTitle.substr(0, searchTitle.length - 3);
                
                searchUrl = this._generateUrl(url, { s: searchTitle, x: 0, y: 0 });
                response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

                $ = cheerio.load(response);

                foundPages = $('.post h2 a').toArray().reduce((returnArray, element) => {
                    const foundTitle = $(element).attr('title').toLowerCase().replace(/<u>|<\/u>/g, '');
                    const foundLink = $(element).attr('href');
                    
                    if (foundTitle.includes(searchTitle)) {
                        returnArray.push(foundLink);
                    }
    
                    return returnArray;
                }, []);
            }

            for (let page of foundPages) {
                let pageHTML = await this._createRequest(rp, page, jar, headers, {}, true);

                $ = cheerio.load(pageHTML);

                $('.links .trusted .comm_content a').toArray().forEach(element => {
                    let link = $(element).attr('href');
                    let rightLink = true;
                    if (type == 'tv' &&  !link.includes(formattedEpisode)) {
                        rightLink = false;
                    }
                    if (!link.includes('.sample') && !link.includes('.subs') && rightLink) {
                        let quality = Utils.qualityFromFile(link);
                        resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
                    }
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
