const Promise = require('bluebird');
const cheerio = require('cheerio');
const utils = require('../../../utils/index')
const BaseProvider = require('../BaseProvider');

module.exports = class GoWatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://gowatchseries.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {};

        try {
            let searchTitle = `${title}`;
            if (type == 'tv') {
                searchTitle = `${searchTitle} - season ${season}`;
            }
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchUrl = (`${url}/search.html?keyword=${searchTitle.replace(/ /g, '%20')}`);
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let contentPage = '';
            $(".listing li").toArray().some(element => {
                let linkElement = $(element).find("a");
                let contentLink = `${url}${linkElement.attr('href')}`;
                let posterTitle = linkElement.find('.name').text().toLowerCase();

                if (posterTitle == searchTitle) {
                    contentPage = contentLink;
                }
            });
            if (!contentPage) {
                return Promise.resolve();
            }

            let contentPageHTML = await this._createRequest(rp, contentPage, jar, headers);

            $ = cheerio.load(contentPageHTML);

            let videoPage = '';
            if (type == 'tv') {
                $('.child_episode').toArray().forEach(element => {
                    const compareString = `-episode-${episode}`;
                    const episodeLink = $(element).find('a').attr('href');

                    if (episodeLink.endsWith(compareString)) {
                        videoPage = url + episodeLink;
                    }
                });
            } else {
                videoPage = url + $('.child_episode a').attr('href');
            }
            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('.anime_muti_link ul li').toArray().forEach(element => {
                const providerLink = utils.normalizeUrl($(element).attr('data-video'));
                resolvePromises.push(this.resolveLink(providerLink, ws, jar, headers));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}