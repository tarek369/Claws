const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');
const atob = require('atob');

module.exports = class SolarMovie extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://www1.solarmovie.net', 'http://5movies.fm'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const title = req.query.title.toLowerCase();
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {
            'user-agent': randomUseragent.getRandom(),
            'x-real-ip': clientIp,
            'x-forwarded-for': clientIp,
            'referer': url
        };

        try {
            let searchTitle = '';
            if (type == 'tv') {
                searchTitle = `${title}: season ${season}`;
            } else {
                searchTitle = title;
            }
            const searchUrl = (`${url}/search-movies/${searchTitle.replace(/ /g, '+')}.html`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers, {}, true);

            let $ = cheerio.load(response);

            const contentLink = $('.ml-mask').toArray().find((contentPoster) => {
                const contentDescription = $(contentPoster).attr('onmouseover').toLowerCase();
                return contentDescription.includes(title);
            });
            if (!contentLink) {
                return Promise.all(resolvePromises);
            }

            const contentPageLink = $(contentLink).attr('href');
            const contentPageHtml = await this._createRequest(rp, contentPageLink, jar, headers, {}, true);

            $ = cheerio.load(contentPageHtml);

            if (type == 'tv') {
                let episodePageLink = '';
                $('.episode').toArray().find((episodeLink) => {
                    if ($(episodeLink).html() == episode) {
                        episodePageLink = $(episodeLink).attr('href');
                    }
                });
                const episodePageHtml = await this._createRequest(rp, episodePageLink, jar, headers, {}, true);

                $ = cheerio.load(episodePageHtml);
            }

            let mirrorUrls = $('.server_play a').toArray().reduce((providerUrls, mirrorPageLink) => {
                const mirrorPageUrl = $(mirrorPageLink).attr('href');
                providerUrls.push(mirrorPageUrl);
                return providerUrls;
            }, []);

            let mirrorNames = $('.server_servername').toArray().reduce((providerNames, element) => {
                const serverName = $(element).text();
                providerNames.push(serverName);
                return providerNames;
            }, []);

            mirrorUrls = mirrorUrls.reverse();
            mirrorNames = mirrorNames.reverse();

            let previousNum = 1;
            let hostCount = 0;
            for (let i = 0; i < mirrorNames.length; i++) {
                let linkNum = mirrorNames[i].match(/\d+/g);

                // If server name doesn't have a number, it's single so assign it as 1
                if (linkNum == null) {
                    linkNum = 1;
                }
                else
                {
                    linkNum = Number(linkNum);
                }

                // If server was switched, the link number will be greater than the previous number
                if (linkNum >= previousNum) {
                    hostCount = 0;
                }

                // Select 5 links for each server
                if (hostCount < 5) {
                    const mirrorPageHtml = await this._createRequest(rp, mirrorUrls[i], jar, headers, {}, true);

                    $ = cheerio.load(mirrorPageHtml);

                    const encodedScript = $('#media-player script').html();
                    if (encodedScript != null) {
                        const encodedFrame = $('#media-player script').html().split('"')[1];
                        const decodedFrame = atob(encodedFrame);

                        $ = cheerio.load(decodedFrame);

                        const videoUrl = $('iframe').attr('src');
                        resolvePromises.push(this.resolveLink(videoUrl, ws, jar, headers, '', { isDDL: false}, hasRD));
                    }

                    hostCount++;
                }

                // Update previous number and host count
                previousNum = linkNum;
            }
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
