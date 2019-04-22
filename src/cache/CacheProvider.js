const mongoose = require('mongoose');
const CacheSchema = require('../db/models/cache');
const BaseProvider = require('../scrapers/providers/BaseProvider');
const {resolveCachedLink} = require('./CacheUtils');

module.exports = class Cache extends BaseProvider {
    getUrls() {
        return ['cache']
    }
    async scrape(url, req, ws) {
        const title = req.query.title;
        const { season, episode, year, type } = req.query;
        const resolvePromises = [];
        const headers = {
            'user-agent': this.userAgent,
            'x-real-ip': req.client.remoteAddress,
            'x-forwarded-for': req.client.remoteAddress
        };
        let query = {
            'searchData.title': title,
            'searchData.year': year,
        }

        if (type === 'tv') {
            query['searchData.episode'] = episode;
            query['searchData.season'] = season;
        }
        const results = await CacheSchema.find({ ...query })
        this.logger.debug(`Found ${results.length} results in Cache`);

        results.forEach((link) => {
            resolvePromises.push(this.resolveLink(link, ws, {isFromCache: true}));
        })
        return Promise.all(resolvePromises)
    }

    resolveLink(link, ws, metadata) {
        return resolveCachedLink(link, ws, metadata);
    }
}