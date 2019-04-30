const BaseProvider = require('../../BaseProvider');
const Utils = require('../../../../utils/index');
const atob = require('atob');

module.exports = class DirectDownloadTV extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://directdownload.tv'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title;
        const season = req.query.season;
        const episode = req.query.episode;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        const encodedPortion = 'L2FwaT9rZXk9NEIwQkI4NjJGMjRDOEEyOSZrZXl3b3JkPQ==';

        try {
            const paddedSeason = `${season}`.padStart(2, '0');
            const paddedEpisode = `${episode}`.padStart(2, '0');
            const formattedEpisode = `s${paddedSeason}e${paddedEpisode}`;
            let searchUrl = `${url}${atob(encodedPortion)}${title.replace(' ', '%20')}%20${formattedEpisode}`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let json = JSON.parse(response);

            for (let result of json.results) {
                const quality = Utils.getQualityInfo(result.quality);
                const links = result.links;
                for (let host in links) {
                    resolvePromises.push(this.resolveLink(links[host][0], ws, jar, headers, quality, { isDDL: false }, hasRD));
                }
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
