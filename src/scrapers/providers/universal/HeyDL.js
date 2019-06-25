const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class HeyDL extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://heydl.org'];
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
            const audioRegex = /(.[0-9]{4})(.*)(.Dubbed)/;
            let searchTitle = `${title}`;
            let searchUrl = `${url}/search/${searchTitle.replace(' ', '+')}`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            if (type == 'movies') {
                searchTitle = `${title} ${year}`;
            }

            let contentPage = '';
            let contentFound = false;
            $('.box.modern-form').toArray().forEach(element => {
                if (!contentFound) {
                    // Replace is used because HeyDL uses a different apostrophe character...
                    let contentTitle = $(element).find('.title-text a').text().toLowerCase().replace('’', '\'');
                    let contentLink = $(element).find('.title-text a').attr('href');

                    if (contentTitle.includes(searchTitle)) {
                        contentPage = contentLink;
                        contentFound = true;
                    }
                }
            });
            if (!contentPage) {
                return Promise.resolve();
            }

            const contentPageHTML = await this._createRequest(rp, contentPage, jar, headers);

            $ = cheerio.load(contentPageHTML);

            if (type == 'tv') {
                const paddedSeason = `${season}`.padStart(2, '0');
                const paddedEpisode = `${episode}`.padStart(2, '0');
                const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;

                let foundLinks = $('strong a').toArray().reduce((returnArray, element) => {
                    const foundLink = $(element).attr('href');
                    returnArray.push(foundLink);

                    return returnArray;
                }, []);

                const moreLinks = $('.download a').toArray().reduce((returnArray, element) => {
                    const foundLink = $(element).attr('href');
                    returnArray.push(foundLink);

                    return returnArray;
                }, []);

                foundLinks = foundLinks.concat(moreLinks);

                for (const foundLink of foundLinks) {
                    if (foundLink.endsWith('/')) {
                        const hostedFolderHTML = await this._createRequest(rp, foundLink, jar, headers);

                        $ = cheerio.load(hostedFolderHTML);

                        $('a').toArray().forEach(element => {
                            const fileName = $(element).attr('href');
                            if (fileName.toLowerCase().includes(formattedEpisode)) {
                                const directLink = this._absoluteUrl(foundLink, fileName);
                                if (!audioRegex.test(directLink)) {
                                    resolvePromises.push(this.resolveLink(directLink, ws, jar, headers, '', { isDDL: true }, hasRD));
                                }
                            }
                        });
                    } else {
                        if (foundLink.toLowerCase().includes(formattedEpisode) && !audioRegex.test(foundLink)) {
                            resolvePromises.push(this.resolveLink(foundLink, ws, jar, headers, '', { isDDL: true }, hasRD));
                        }
                    }
                }
            } else {
                $('.download a').toArray().forEach(element => {
                    const directLink = $(element).attr('href');
                    if (!audioRegex.test(directLink)) {
                        resolvePromises.push(this.resolveLink(directLink, ws, jar, headers, '', { isDDL: true }, hasRD));
                    }
                });
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
